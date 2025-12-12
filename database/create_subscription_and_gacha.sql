-- サブスクリプションとガチャ用のテーブル作成

-- 1. ユーザープロフィールにSquare顧客IDとサブスク状態を追加
-- 既存のprofilesテーブルがある前提
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
  probability INTEGER NOT NULL, -- 確率（重み付け、またはパーセント）
  type TEXT NOT NULL, -- 'drink_ticket', 'discount_coupon', 'other'
  value INTEGER, -- 割引額など
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 初期データ投入（サンプル）
INSERT INTO gacha_items (name, description, probability, type, value) VALUES
('ドリンクチケット', '提携店舗で使えるドリンクチケットです', 50, 'drink_ticket', 0),
('500円割引券', 'トーナメント参加費から500円割引', 30, 'discount_coupon', 500),
('1000円割引券', 'トーナメント参加費から1000円割引', 10, 'discount_coupon', 1000),
('ハズレ', '残念！また明日挑戦してね', 10, 'none', 0);


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

-- RLSポリシーの設定（必要に応じて）
ALTER TABLE user_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE gacha_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own items" ON user_items
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own logs" ON gacha_logs
  FOR SELECT USING (auth.uid() = user_id);
