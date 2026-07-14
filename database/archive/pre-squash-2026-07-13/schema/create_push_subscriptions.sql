create table if not exists push_subscriptions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  endpoint text not null,
  p256dh text not null,
  auth text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, endpoint)
);

alter table push_subscriptions enable row level security;

-- 既存のポリシーがある場合は削除してから作成する（エラー回避）
drop policy if exists "Users can insert their own subscriptions" on push_subscriptions;
drop policy if exists "Users can delete their own subscriptions" on push_subscriptions;

create policy "Users can insert their own subscriptions"
  on push_subscriptions for insert
  with check (auth.uid() = user_id);

create policy "Users can delete their own subscriptions"
  on push_subscriptions for delete
  using (auth.uid() = user_id);

-- 管理者（Service Role）は全データを操作可能にするため、RLSをバイパスするクエリを使用するか、
-- 必要に応じてポリシーを追加する。今回はサーバーサイドAPIでService Role Keyを使う想定。
