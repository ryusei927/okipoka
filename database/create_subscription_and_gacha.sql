-- サブスクリプションとガチャ用のテーブル作成

-- 1. ユーザープロフィールにSquare顧客IDとサブスク状態を追加
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS square_customer_id TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS subscription_id TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'inactive'; -- active, inactive, past_due, canceled
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_gacha_at TIMESTAMPTZ;

-- 2. ガチャの景品マスタ
CREATE TABLE IF NOT EXISTS gacha_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  probability INTEGER NOT NULL, -- 確率（重み付け）
  type TEXT NOT NULL, -- 'drink_ticket', 'discount_coupon', 'other', 'none'
  value INTEGER, -- 割引額など
  cost_yen INTEGER NOT NULL DEFAULT 0,
  expires_days INTEGER NOT NULL DEFAULT 30, -- 当選後の有効期限（日）
  stock_total INTEGER, -- 当選上限（NULLなら無制限）
  stock_used INTEGER NOT NULL DEFAULT 0, -- 消費済み（当選回数）
  is_active BOOLEAN DEFAULT true,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE gacha_items ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

ALTER TABLE gacha_items
  ADD COLUMN IF NOT EXISTS cost_yen INTEGER NOT NULL DEFAULT 0;

ALTER TABLE gacha_items
  ADD COLUMN IF NOT EXISTS expires_days INTEGER NOT NULL DEFAULT 30;

ALTER TABLE gacha_items
  ADD COLUMN IF NOT EXISTS stock_total INTEGER;

ALTER TABLE gacha_items
  ADD COLUMN IF NOT EXISTS stock_used INTEGER NOT NULL DEFAULT 0;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'gacha_items_stock_nonnegative'
  ) THEN
    ALTER TABLE gacha_items
      ADD CONSTRAINT gacha_items_stock_nonnegative
      CHECK (
        (stock_total IS NULL OR stock_total >= 0)
        AND stock_used >= 0
        AND (stock_total IS NULL OR stock_used <= stock_total)
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'gacha_items_expires_days_nonnegative'
  ) THEN
    ALTER TABLE public.gacha_items
      ADD CONSTRAINT gacha_items_expires_days_nonnegative
      CHECK (expires_days >= 0);
  END IF;
END $$;

-- 初期データ投入（サンプル）
-- 既に同名・同typeのデータがある場合は重複投入しない
INSERT INTO gacha_items (name, description, probability, type, value, cost_yen)
SELECT 'ドリンクチケット', '提携店舗で使えるドリンクチケットです', 50, 'drink_ticket', 0, 0
WHERE NOT EXISTS (
  SELECT 1 FROM gacha_items WHERE name = 'ドリンクチケット' AND type = 'drink_ticket' AND deleted_at IS NULL
);

INSERT INTO gacha_items (name, description, probability, type, value, cost_yen)
SELECT '500円割引券', 'トーナメント参加費から500円割引', 30, 'discount_coupon', 500, 0
WHERE NOT EXISTS (
  SELECT 1 FROM gacha_items WHERE name = '500円割引券' AND type = 'discount_coupon' AND deleted_at IS NULL
);

INSERT INTO gacha_items (name, description, probability, type, value, cost_yen)
SELECT '1000円割引券', 'トーナメント参加費から1000円割引', 10, 'discount_coupon', 1000, 0
WHERE NOT EXISTS (
  SELECT 1 FROM gacha_items WHERE name = '1000円割引券' AND type = 'discount_coupon' AND deleted_at IS NULL
);

INSERT INTO gacha_items (name, description, probability, type, value, cost_yen)
SELECT 'ハズレ', '残念！また明日挑戦してね', 10, 'none', 0, 0
WHERE NOT EXISTS (
  SELECT 1 FROM gacha_items WHERE name = 'ハズレ' AND type = 'none' AND deleted_at IS NULL
);


-- 3. ユーザーが獲得したアイテム（チケット）
CREATE TABLE IF NOT EXISTS user_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  item_id UUID REFERENCES gacha_items(id),
  is_used BOOLEAN DEFAULT false,
  used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. ガチャ実行履歴（1日1回制限用）
CREATE TABLE IF NOT EXISTS gacha_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  item_id UUID REFERENCES gacha_items(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLSポリシーの設定
ALTER TABLE user_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE gacha_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE gacha_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own items" ON user_items;
CREATE POLICY "Users can view their own items" ON user_items
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admin can view all user items" ON user_items;
CREATE POLICY "Admin can view all user items" ON user_items
  FOR SELECT USING ( (auth.jwt() ->> 'email') = 'okipoka.jp@gmail.com' );

DROP POLICY IF EXISTS "Users can insert their own items" ON user_items;
CREATE POLICY "Users can insert their own items" ON user_items
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own items" ON user_items;
CREATE POLICY "Users can update their own items" ON user_items
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view their own logs" ON gacha_logs;
CREATE POLICY "Users can view their own logs" ON gacha_logs
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own logs" ON gacha_logs;
CREATE POLICY "Users can insert their own logs" ON gacha_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Anyone can view active gacha items" ON gacha_items;
CREATE POLICY "Anyone can view active gacha items" ON gacha_items
  FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Admin can view all gacha items" ON gacha_items;
CREATE POLICY "Admin can view all gacha items" ON gacha_items
  FOR SELECT USING ( (auth.jwt() ->> 'email') = 'okipoka.jp@gmail.com' );

DROP POLICY IF EXISTS "Admin can manage gacha items" ON gacha_items;
CREATE POLICY "Admin can manage gacha items" ON gacha_items
  FOR ALL
  USING ( (auth.jwt() ->> 'email') = 'okipoka.jp@gmail.com' )
  WITH CHECK ( (auth.jwt() ->> 'email') = 'okipoka.jp@gmail.com' );


-- ガチャを1回回す（数量制限/1日1回/サブスクチェック込み）
-- NOTE: gacha_items は通常ユーザーが更新できないため、SECURITY DEFINER で在庫消費を行う。
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
        created_at
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
      'stock_used', v_new_stock_used
    );
  END LOOP;
END;
$$;

REVOKE ALL ON FUNCTION public.spin_gacha() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.spin_gacha() TO authenticated;
