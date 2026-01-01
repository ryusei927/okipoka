-- spin_gacha関数を更新：現金払いの期限切れチェックを追加
CREATE OR REPLACE FUNCTION public.spin_gacha()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_email text;
  v_status text;
  v_payment_method text;
  v_expires_at date;
  v_last_gacha_at timestamptz;
  v_now timestamptz := now();
  v_today date := (v_now AT TIME ZONE 'Asia/Tokyo')::date;
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

  SELECT subscription_status, last_gacha_at, payment_method, subscription_expires_at
    INTO v_status, v_last_gacha_at, v_payment_method, v_expires_at
  FROM profiles
  WHERE id = v_user_id;

  -- 現金払いの期限切れチェック
  IF v_payment_method = 'cash' AND v_expires_at IS NOT NULL AND v_expires_at < v_today THEN
    -- 期限切れ → ステータスを自動で canceled に更新
    UPDATE profiles
    SET subscription_status = 'canceled',
        payment_method = NULL,
        subscription_expires_at = NULL
    WHERE id = v_user_id;
    
    RAISE EXCEPTION 'Subscription expired';
  END IF;

  IF v_status IS DISTINCT FROM 'active' AND v_status IS DISTINCT FROM 'canceling' THEN
    RAISE EXCEPTION 'Subscription required';
  END IF;

  -- JWTにemailが無いケースがあるため、auth.users.emailへフォールバックする
  v_email := lower(
    coalesce(
      auth.jwt() ->> 'email',
      (SELECT u.email FROM auth.users u WHERE u.id = v_user_id)
    )
  );

  -- 管理者以外は1日1回（JST基準）
  IF v_email IS DISTINCT FROM 'okipoka.jp@gmail.com' THEN
    IF v_last_gacha_at IS NOT NULL THEN
      IF (v_last_gacha_at AT TIME ZONE 'Asia/Tokyo')::date = v_today THEN
        RAISE EXCEPTION 'Already played today';
      END IF;
    END IF;
  END IF;

  LOOP
    v_try := v_try + 1;
    IF v_try > 10 THEN
      RAISE EXCEPTION 'No items available';
    END IF;

    -- 抽選対象の重み合計を計算（ユーザーごとの上限も考慮）
    SELECT COALESCE(SUM(gi.probability), 0)
      INTO v_total_weight
    FROM gacha_items gi
    LEFT JOIN (
      SELECT item_id, COUNT(*) as user_count
      FROM user_items
      WHERE user_id = v_user_id
      GROUP BY item_id
    ) ui ON gi.id = ui.item_id
    WHERE gi.is_active = true
      AND gi.deleted_at IS NULL
      AND (gi.stock_total IS NULL OR gi.stock_used < gi.stock_total)
      AND (gi.limit_per_user IS NULL OR COALESCE(ui.user_count, 0) < gi.limit_per_user);

    IF v_total_weight <= 0 THEN
      RAISE EXCEPTION 'No items available';
    END IF;

    v_rand := random() * v_total_weight;

    WITH eligible AS (
      SELECT
        gi.id,
        gi.name,
        gi.type,
        gi.value,
        gi.image_url,
        gi.probability,
        gi.stock_total,
        gi.stock_used,
        gi.expires_in_days,
        gi.limit_per_user,
        gi.shop_id,
        SUM(gi.probability) OVER (ORDER BY gi.id) AS cumulative
      FROM gacha_items gi
      LEFT JOIN (
        SELECT item_id, COUNT(*) as user_count
        FROM user_items
        WHERE user_id = v_user_id
        GROUP BY item_id
      ) ui ON gi.id = ui.item_id
      WHERE gi.is_active = true
        AND gi.deleted_at IS NULL
        AND (gi.stock_total IS NULL OR gi.stock_used < gi.stock_total)
        AND (gi.limit_per_user IS NULL OR COALESCE(ui.user_count, 0) < gi.limit_per_user)
    )
    SELECT * INTO v_selected FROM eligible WHERE cumulative >= v_rand LIMIT 1;

    IF v_selected IS NULL THEN
      RAISE EXCEPTION 'No items available';
    END IF;

    IF v_selected.stock_total IS NOT NULL THEN
      UPDATE gacha_items
      SET stock_used = stock_used + 1
      WHERE id = v_selected.id
        AND stock_used < stock_total
      RETURNING stock_used INTO v_new_stock_used;

      IF v_new_stock_used IS NULL THEN
        CONTINUE;
      END IF;
    END IF;

    EXIT;
  END LOOP;

  IF v_selected.type IS DISTINCT FROM 'none' THEN
    INSERT INTO user_items (user_id, item_id, expires_at)
    VALUES (
      v_user_id,
      v_selected.id,
      CASE
        WHEN v_selected.expires_in_days IS NOT NULL THEN v_now + (v_selected.expires_in_days || ' days')::interval
        ELSE NULL
      END
    );
  END IF;

  UPDATE profiles SET last_gacha_at = v_now WHERE id = v_user_id;

  RETURN jsonb_build_object(
    'id', v_selected.id,
    'name', v_selected.name,
    'type', v_selected.type,
    'value', v_selected.value,
    'image_url', v_selected.image_url,
    'shop_id', v_selected.shop_id
  );
END;
$$;
