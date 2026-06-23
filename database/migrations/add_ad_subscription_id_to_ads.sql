-- 広告クリエイティブ（ads）と広告課金（ad_subscriptions）を紐づける。
-- 既存の手動広告は NULL のまま（従来通り手動運用）。
-- セルフサーブ申込で自動生成された下書き広告にのみ課金が紐づく。
-- 課金レコードが削除されても広告自体は残す（on delete set null）。

alter table ads
  add column if not exists ad_subscription_id uuid references ad_subscriptions(id) on delete set null;

create index if not exists ads_ad_subscription_idx on ads (ad_subscription_id);
