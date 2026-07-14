-- Instagramサブスク登録キャンペーンの応募同意ログを追加する。
-- 既に create_subscription_campaign_entries.sql を実行済みの環境向け。
-- TODO(Instagramサブスクキャンペーン終了後): キャンペーン機能削除時にこの追加項目も不要ならdropする。

alter table public.subscription_campaign_entries
  add column if not exists publicity_consent_at timestamptz,
  add column if not exists prize_contact_consent_at timestamptz;
