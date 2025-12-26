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
  v_last_gacha_at timestamptz;
  v_now timestamptz := now();
  v_month_start timestamptz := (date_trunc('month', (now() AT TIME ZONE 'Asia/Tokyo')) AT TIME ZONE 'Asia/Tokyo');
  v_total_weight integer;
  v_rand numeric;
  v_try integer := 0;
  v_selected record;
  v_new_stock_used integer;
  v_current_user_count integer;
  v_locked_stock_used integer;
  v_locked_stock_total integer;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- 同一ユーザーの並行実行を防ぐ（1日1回制限の競合対策）
  SELECT subscription_status, last_gacha_at
    INTO v_status, v_last_gacha_at
  FROM profiles
  WHERE id = v_user_id
  FOR UPDATE;

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

    -- 抽選対象の重み合計を計算
    -- 月次リセット(is_monthly_limit=true)の場合は、当月のログを集計して判定
    SELECT COALESCE(SUM(gi.probability), 0)
      INTO v_total_weight
    FROM gacha_items gi
    LEFT JOIN (
      -- ユーザーの獲得数集計（全期間と当月）
      SELECT 
        item_id, 
        COUNT(*) as total_count,
        COUNT(*) FILTER (WHERE created_at >= v_month_start) as monthly_count
      FROM user_items
      WHERE user_id = v_user_id
      GROUP BY item_id
    ) ui ON gi.id = ui.item_id
    LEFT JOIN (
       -- 全体の排出数集計（当月のみ、月次制限アイテム用）
       SELECT item_id, COUNT(*) as monthly_used
       FROM gacha_logs
       WHERE created_at >= v_month_start
       GROUP BY item_id
    ) gl ON gi.id = gl.item_id
    WHERE gi.is_active = true
      AND gi.deleted_at IS NULL
      -- 在庫チェック
      AND (
        gi.stock_total IS NULL 
        OR (
          CASE 
            WHEN gi.is_monthly_limit THEN COALESCE(gl.monthly_used, 0) < gi.stock_total
            ELSE gi.stock_used < gi.stock_total
          END
        )
      )
      -- ユーザー上限チェック
      AND (
        gi.limit_per_user IS NULL 
        OR (
          CASE 
            WHEN gi.is_monthly_limit THEN COALESCE(ui.monthly_count, 0) < gi.limit_per_user
            ELSE COALESCE(ui.total_count, 0) < gi.limit_per_user
          END
        )
      );

    IF v_total_weight <= 0 THEN
      RAISE EXCEPTION 'No items available';
    END IF;

    v_rand := random() * v_total_weight;

    WITH eligible AS (
      SELECT
        gi.id,
        gi.name,
        gi.description,
        gi.image_url,
        gi.probability,
        gi.type,
        gi.value,
        gi.cost_yen,
        gi.expires_days,
        gi.stock_total,
        gi.stock_used, -- これは累積値
        gi.created_at,
        gi.shop_id,
        gi.limit_per_user,
        gi.is_monthly_limit,
        COALESCE(gl.monthly_used, 0) as current_monthly_used
      FROM gacha_items gi
      LEFT JOIN (
        SELECT 
          item_id, 
          COUNT(*) as total_count,
          COUNT(*) FILTER (WHERE created_at >= v_month_start) as monthly_count
        FROM user_items
        WHERE user_id = v_user_id
        GROUP BY item_id
      ) ui ON gi.id = ui.item_id
      LEFT JOIN (
         SELECT item_id, COUNT(*) as monthly_used
         FROM gacha_logs
         WHERE created_at >= v_month_start
         GROUP BY item_id
      ) gl ON gi.id = gl.item_id
      WHERE gi.is_active = true
        AND gi.deleted_at IS NULL
        AND (
          gi.stock_total IS NULL 
          OR (
            CASE 
              WHEN gi.is_monthly_limit THEN COALESCE(gl.monthly_used, 0) < gi.stock_total
              ELSE gi.stock_used < gi.stock_total
            END
          )
        )
        AND (
          gi.limit_per_user IS NULL 
          OR (
            CASE 
              WHEN gi.is_monthly_limit THEN COALESCE(ui.monthly_count, 0) < gi.limit_per_user
              ELSE COALESCE(ui.total_count, 0) < gi.limit_per_user
            END
          )
        )
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

    -- 数量制限がある当たり景品だけ在庫を消費（ハズレは消費しない）
    -- 月次制限の場合も、累積の stock_used はインクリメントしておく（統計用）
    v_new_stock_used := v_selected.stock_used;
    IF v_selected.stock_total IS NOT NULL AND v_selected.type <> 'none' THEN
      -- 対象アイテムの行を先にロックしてから、在庫判定を再確認する（同時実行のズレ対策）
      SELECT stock_used, stock_total
        INTO v_locked_stock_used, v_locked_stock_total
      FROM gacha_items
      WHERE id = v_selected.id
      FOR UPDATE;

      IF v_selected.is_monthly_limit THEN
        IF (SELECT COUNT(*) FROM gacha_logs WHERE item_id = v_selected.id AND created_at >= v_month_start) >= v_locked_stock_total THEN
          CONTINUE;
        END IF;
      ELSE
        IF v_locked_stock_used >= v_locked_stock_total THEN
          CONTINUE;
        END IF;
      END IF;

      UPDATE gacha_items
        SET stock_used = stock_used + 1
      WHERE id = v_selected.id
      RETURNING stock_used INTO v_new_stock_used;
    END IF;

    -- ユーザーごとの上限チェック（念のため再確認）
    IF v_selected.limit_per_user IS NOT NULL THEN
      SELECT COUNT(*) INTO v_current_user_count
      FROM user_items 
      WHERE user_id = v_user_id 
        AND item_id = v_selected.id
        AND (NOT v_selected.is_monthly_limit OR created_at >= v_month_start);

      IF v_current_user_count >= v_selected.limit_per_user THEN
        -- 上限到達時は在庫戻してやり直し
        IF v_selected.stock_total IS NOT NULL AND v_selected.type <> 'none' THEN
          UPDATE gacha_items SET stock_used = stock_used - 1 WHERE id = v_selected.id;
        END IF;
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
$$;
