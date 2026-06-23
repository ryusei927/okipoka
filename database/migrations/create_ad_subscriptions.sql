-- 広告掲載プラン（月額3,800円）の申込者を記録するテーブル。
-- サイト上の公開申込ページ（/ad-signup）から作成され、Square のサブスクと紐づく。
-- 書き込みは service role（API）経由のみ。管理画面での閲覧用に認証ユーザーへ select を許可。

create table if not exists ad_subscriptions (
  id uuid default gen_random_uuid() primary key,
  business_name text not null,
  contact_name text,
  email text not null,
  phone text,
  note text,
  square_customer_id text,
  square_subscription_id text,
  -- active / canceling / canceled / past_due
  subscription_status text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists ad_subscriptions_email_idx on ad_subscriptions (email);
create index if not exists ad_subscriptions_subscription_idx on ad_subscriptions (square_subscription_id);

alter table ad_subscriptions enable row level security;

-- 管理者（認証ユーザー）のみ閲覧可能。挿入・更新は service role（RLSをバイパス）が行う。
drop policy if exists "Admins can view ad subscriptions" on ad_subscriptions;
create policy "Admins can view ad subscriptions"
  on ad_subscriptions for select
  using (auth.role() = 'authenticated');
