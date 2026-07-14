-- プレミアムコード（店頭販売用プリペイドカード）の仕組み
--
-- 概要:
--   店舗で現金販売するカードに印字したコードを、ユーザーがマイページで入力すると
--   既存の現金会員（payment_method='cash' + subscription_expires_at）として
--   プレミアムが有効化される。
--
-- 運用メモ:
--   - コードは管理画面（/dashboard/premium-codes）から一括発行し、CSVで印刷業者へ渡す
--   - 資金決済法（前払式支払手段）の適用除外とするため、コードの登録期限
--     （expires_at）は発行から6ヶ月以内に設定すること
--
-- 適用方法: Supabase SQL Editor でこのファイル全体を実行

-- 1) コード本体
CREATE TABLE IF NOT EXISTS premium_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- 正規化済みコード（英数字のみ・大文字・ハイフンなし。表示時に4文字区切りにする）
  code TEXT NOT NULL UNIQUE,
  duration_months INTEGER NOT NULL CHECK (duration_months BETWEEN 1 AND 12),
  -- 額面（販売価格）。集計・照合用
  face_value_yen INTEGER,
  -- 発行ロット名（例: "2026-07 ジャックナイン那覇 50枚"）
  batch_label TEXT,
  status TEXT NOT NULL DEFAULT 'unused' CHECK (status IN ('unused', 'redeemed', 'void')),
  -- 登録期限（この日を過ぎたコードは使用不可）
  expires_at DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  redeemed_by UUID REFERENCES auth.users(id),
  redeemed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_premium_codes_status ON premium_codes(status);
CREATE INDEX IF NOT EXISTS idx_premium_codes_batch ON premium_codes(batch_label);

-- 2) 入力試行ログ（総当たり対策のレート制限用）
CREATE TABLE IF NOT EXISTS premium_code_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  attempted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  success BOOLEAN NOT NULL DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_premium_code_attempts_user
  ON premium_code_attempts(user_id, attempted_at);

-- 3) RLS: 直接の読み書きは一切許可しない
--    （利用は SECURITY DEFINER 関数経由、管理は service role 経由のみ）
ALTER TABLE premium_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE premium_code_attempts ENABLE ROW LEVEL SECURITY;

-- 4) コード利用関数
--    ログイン中のユーザーがコードを使ってプレミアム（現金会員）を有効化/延長する
CREATE OR REPLACE FUNCTION public.redeem_premium_code(p_code TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_normalized TEXT;
  v_code premium_codes%ROWTYPE;
  v_attempts INTEGER;
  v_profile RECORD;
  v_today DATE;
  v_base DATE;
  v_new_expiry DATE;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN json_build_object('ok', false, 'error', 'unauthorized');
  END IF;

  v_today := (now() AT TIME ZONE 'Asia/Tokyo')::date;

  -- レート制限: 直近1時間に10回以上失敗していたら拒否
  SELECT count(*) INTO v_attempts
  FROM premium_code_attempts
  WHERE user_id = v_user_id
    AND success = false
    AND attempted_at > now() - interval '1 hour';

  IF v_attempts >= 10 THEN
    RETURN json_build_object('ok', false, 'error', 'rate_limited');
  END IF;

  -- 入力の正規化（大文字化・英数字以外を除去）
  v_normalized := upper(regexp_replace(p_code, '[^0-9A-Za-z]', '', 'g'));

  -- コードを行ロック付きで取得（二重使用の防止）
  SELECT * INTO v_code
  FROM premium_codes
  WHERE code = v_normalized
  FOR UPDATE;

  IF NOT FOUND THEN
    INSERT INTO premium_code_attempts (user_id, success) VALUES (v_user_id, false);
    RETURN json_build_object('ok', false, 'error', 'not_found');
  END IF;

  IF v_code.status = 'redeemed' THEN
    INSERT INTO premium_code_attempts (user_id, success) VALUES (v_user_id, false);
    RETURN json_build_object('ok', false, 'error', 'already_used');
  END IF;

  IF v_code.status = 'void' THEN
    INSERT INTO premium_code_attempts (user_id, success) VALUES (v_user_id, false);
    RETURN json_build_object('ok', false, 'error', 'void');
  END IF;

  IF v_code.expires_at < v_today THEN
    INSERT INTO premium_code_attempts (user_id, success) VALUES (v_user_id, false);
    RETURN json_build_object('ok', false, 'error', 'expired');
  END IF;

  SELECT subscription_status, payment_method, subscription_expires_at
    INTO v_profile
  FROM profiles
  WHERE id = v_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN json_build_object('ok', false, 'error', 'profile_not_found');
  END IF;

  -- Squareのカードサブスクが有効な人は二重払いになるため拒否
  IF v_profile.subscription_status IN ('active', 'canceling')
     AND coalesce(v_profile.payment_method, '') <> 'cash' THEN
    INSERT INTO premium_code_attempts (user_id, success) VALUES (v_user_id, false);
    RETURN json_build_object('ok', false, 'error', 'card_subscription_active');
  END IF;

  -- 有効な現金会員なら残り期間に加算、それ以外は今日から起算
  IF v_profile.payment_method = 'cash'
     AND v_profile.subscription_status = 'active'
     AND v_profile.subscription_expires_at IS NOT NULL
     AND v_profile.subscription_expires_at >= v_today THEN
    v_base := v_profile.subscription_expires_at;
  ELSE
    v_base := v_today;
  END IF;

  v_new_expiry := v_base + (v_code.duration_months || ' months')::interval;

  UPDATE profiles
  SET subscription_status = 'active',
      payment_method = 'cash',
      subscription_expires_at = v_new_expiry
  WHERE id = v_user_id;

  UPDATE premium_codes
  SET status = 'redeemed',
      redeemed_by = v_user_id,
      redeemed_at = now()
  WHERE id = v_code.id;

  INSERT INTO premium_code_attempts (user_id, success) VALUES (v_user_id, true);

  RETURN json_build_object(
    'ok', true,
    'duration_months', v_code.duration_months,
    'expires_at', to_char(v_new_expiry, 'YYYY-MM-DD')
  );
END;
$$;

-- 認証済みユーザーのみ実行可能にする
REVOKE ALL ON FUNCTION public.redeem_premium_code(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.redeem_premium_code(TEXT) TO authenticated;
