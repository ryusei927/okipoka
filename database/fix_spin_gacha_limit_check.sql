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

  SELECT subscription_status, last_gacha_at
    INTO v_status, v_last_gacha_at
  FROM profiles
  WHERE id = v_user_id;

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
        gi.description,
        gi.image_url,
        gi.probability,
        gi.type,
        gi.value,
        gi.cost_yen,
        gi.expires_days,
        gi.stock_total,
        gi.stock_used,
        gi.created_at,
        gi.shop_id,
        gi.limit_per_user
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

    -- ユーザーごとの上限チェック（念のため再確認）
    IF v_selected.limit_per_user IS NOT NULL THEN
      IF (SELECT COUNT(*) FROM user_items WHERE user_id = v_user_id AND item_id = v_selected.id) >= v_selected.limit_per_user THEN
        -- 既に上限に達している場合は、在庫消費をロールバックしてやり直し（実際には在庫消費はコミット前なので影響なし）
        -- ただし、UPDATE文は実行されてしまっているので、在庫を戻す必要がある
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
