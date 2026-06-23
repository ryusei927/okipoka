-- =============================================================================
-- spin_gacha() — ガチャ抽選関数の【決定版】（single source of truth）
-- =============================================================================
-- これは現在 本番DB で稼働している spin_gacha() を基準に、
-- 「1日1回」制限の競合（レースコンディション）対策だけを加えた決定版です。
--
-- 機能:
--   - 認証チェック（未ログインは 'Unauthorized'）
--   - サブスク有効判定（active / canceling 以外は 'Subscription required'）
--   - 1日1回制限（JST基準、管理者 okipoka.jp@gmail.com は無制限）
--   - 在庫管理（stock_total に達したアイテムは抽選対象外、'none' 型は在庫消費しない）
--   - gacha_logs / user_items への記録、profiles.last_gacha_at 更新
--   - shop_id を含む結果を jsonb で返す
--
-- 【今回の修正点】
--   profiles 行を SELECT ... FOR UPDATE で読むことで、同時リクエストを直列化。
--   連打・並列送信による「1日に複数回引ける」抜け穴を塞ぐ。
--   （2本目のリクエストは1本目のコミット後に最新の last_gacha_at を読み直し、
--     'Already played today' で正しく弾かれる）
--
-- 過去の更新ファイル（update_spin_gacha_*.sql / fix_spin_gacha_*.sql /
-- create_subscription_and_gacha.sql 内の定義）は歴史的経緯であり、
-- 今後は本ファイルを唯一の基準とすること。
-- =============================================================================

CREATE OR REPLACE FUNCTION public.spin_gacha()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id uuid;
  v_email text;
  v_status text;
  v_last_gacha_at timestamptz;
  v_now timestamptz := now();
  v_total_weight integer;
  v_rand numeric;
  v_try integer := 0;
  v_selected record;
  v_new_stock_used integer;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- 【修正】FOR UPDATE で行ロックを取り、同一ユーザーの同時実行を直列化する。
  -- これにより「1日1回」判定と last_gacha_at 更新の間の競合を防ぐ。
  SELECT subscription_status, last_gacha_at
    INTO v_status, v_last_gacha_at
  FROM profiles
  WHERE id = v_user_id
  FOR UPDATE;

  IF v_status IS DISTINCT FROM 'active' AND v_status IS DISTINCT FROM 'canceling' THEN
    RAISE EXCEPTION 'Subscription required';
  END IF;

  v_email := lower(
    coalesce(
      auth.jwt() ->> 'email',
      (SELECT u.email FROM auth.users u WHERE u.id = v_user_id)
    )
  );

  IF v_email IS DISTINCT FROM 'okipoka.jp@gmail.com' THEN
    IF v_last_gacha_at IS NOT NULL THEN
      IF (v_last_gacha_at AT TIME ZONE 'Asia/Tokyo')::date = (v_now AT TIME ZONE 'Asia/Tokyo')::date THEN
        RAISE EXCEPTION 'Already played today';
      END IF;
    END IF;
  END IF;

  LOOP
    v_try := v_try + 1;
    IF v_try > 10 THEN
      RAISE EXCEPTION 'No items available';
    END IF;

    SELECT COALESCE(SUM(probability), 0)
      INTO v_total_weight
    FROM gacha_items
    WHERE is_active = true
      AND deleted_at IS NULL
      AND (stock_total IS NULL OR stock_used < stock_total);

    IF v_total_weight <= 0 THEN
      RAISE EXCEPTION 'No items available';
    END IF;

    v_rand := random() * v_total_weight;

    WITH eligible AS (
      SELECT
        id,
        name,
        description,
        image_url,
        probability,
        type,
        value,
        cost_yen,
        expires_days,
        stock_total,
        stock_used,
        created_at,
        shop_id
      FROM gacha_items
      WHERE is_active = true
        AND deleted_at IS NULL
        AND (stock_total IS NULL OR stock_used < stock_total)
    ),
    ordered AS (
      SELECT
        *,
        SUM(probability) OVER (ORDER BY created_at, id) AS cum_weight
      FROM eligible
    )
    SELECT *
      INTO v_selected
    FROM ordered
    WHERE v_rand < cum_weight
    ORDER BY cum_weight
    LIMIT 1;

    IF NOT FOUND THEN
      CONTINUE;
    END IF;

    v_new_stock_used := v_selected.stock_used;
    IF v_selected.stock_total IS NOT NULL AND v_selected.type <> 'none' THEN
      UPDATE gacha_items
        SET stock_used = stock_used + 1
      WHERE id = v_selected.id
        AND deleted_at IS NULL
        AND is_active = true
        AND stock_total IS NOT NULL
        AND stock_used < stock_total
      RETURNING stock_used INTO v_new_stock_used;

      IF NOT FOUND THEN
        CONTINUE;
      END IF;
    END IF;

    INSERT INTO gacha_logs (user_id, item_id, created_at)
    VALUES (v_user_id, v_selected.id, v_now);

    IF v_selected.type <> 'none' THEN
      INSERT INTO user_items (user_id, item_id, expires_at, created_at)
      VALUES (
        v_user_id,
        v_selected.id,
        v_now + (INTERVAL '1 day' * GREATEST(0, COALESCE(v_selected.expires_days, 30))),
        v_now
      );
    END IF;

    UPDATE profiles
      SET last_gacha_at = v_now
    WHERE id = v_user_id;

    RETURN jsonb_build_object(
      'id', v_selected.id,
      'name', v_selected.name,
      'description', v_selected.description,
      'image_url', v_selected.image_url,
      'probability', v_selected.probability,
      'type', v_selected.type,
      'value', v_selected.value,
      'cost_yen', v_selected.cost_yen,
      'expires_days', v_selected.expires_days,
      'stock_total', v_selected.stock_total,
      'stock_used', v_new_stock_used,
      'shop_id', v_selected.shop_id
    );
  END LOOP;
END;
$function$;
