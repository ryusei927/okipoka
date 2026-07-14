-- プレミアム会員の支払い方法と有効期限を管理するカラムを追加
-- payment_method: 'card'(クレジットカード), 'cash'(現金/店頭払い) など
-- subscription_expires_at: 現金払いの場合の有効期限

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT NULL;

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS subscription_expires_at DATE DEFAULT NULL;

-- インデックス追加（現金払いユーザーの検索用）
CREATE INDEX IF NOT EXISTS idx_profiles_payment_method ON profiles(payment_method);
