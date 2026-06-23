-- 現金会員（payment_method='cash'）の有効期限切れを自動で無効化する仕組み
--
-- 背景:
--   現金会員は管理者付与時に subscription_status='active' + subscription_expires_at で管理される。
--   しかし期限を過ぎても自動で canceled に落ちる処理が無く、プレミアム特典（毎日ガチャ等）を
--   使い続けられてしまうバグがあった。
--   アプリ側（/api/gacha/spin・会員ページ）でも期限を評価するように修正済みだが、
--   DB のステータス自体も正しく保つために、ここで自動失効の仕組みを用意する。

-- 1) 期限切れ現金会員を一括で無効化する関数
CREATE OR REPLACE FUNCTION public.expire_cash_subscriptions()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer;
BEGIN
  WITH expired AS (
    UPDATE profiles
    SET subscription_status = 'canceled',
        payment_method = NULL,
        subscription_expires_at = NULL
    WHERE payment_method = 'cash'
      AND subscription_expires_at IS NOT NULL
      AND subscription_expires_at < (now() AT TIME ZONE 'Asia/Tokyo')::date
    RETURNING 1
  )
  SELECT count(*) INTO v_count FROM expired;
  RETURN v_count;
END;
$$;

-- 2) 既存の期限切れデータを今すぐ1回クリーンアップする
SELECT public.expire_cash_subscriptions();

-- 3) 毎日自動実行（任意・推奨）
--    pg_cron 拡張が必要です。Supabase ダッシュボード > Database > Extensions で
--    "pg_cron" を有効化してから、以下を SQL Editor で実行してください。
--    スケジュールは JST 0:10（= UTC 15:10）に毎日実行。
--
--    select cron.schedule(
--      'expire-cash-subscriptions',
--      '10 15 * * *',
--      $$ select public.expire_cash_subscriptions(); $$
--    );
--
--    ※ 既に同名ジョブがある場合は先に解除:
--    select cron.unschedule('expire-cash-subscriptions');
