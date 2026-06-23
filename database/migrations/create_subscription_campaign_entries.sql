-- Instagramサブスク登録キャンペーンの応募者を記録する一時テーブル。
-- TODO(Instagramサブスクキャンペーン終了後): アプリ側の導線削除後、このテーブルも不要ならdropする。

create table if not exists public.subscription_campaign_entries (
  id uuid default gen_random_uuid() primary key,
  campaign_key text not null,
  user_id uuid not null references public.profiles(id) on delete cascade,
  instagram_username text not null,
  draw_number text not null,
  -- entered / story_confirmed / eligible / won / invalid
  status text not null default 'entered',
  story_posted_at timestamptz,
  story_checked_at timestamptz,
  eligible_at timestamptz,
  admin_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint subscription_campaign_entries_status_check
    check (status in ('entered', 'story_confirmed', 'eligible', 'won', 'invalid')),
  constraint subscription_campaign_entries_campaign_user_unique
    unique (campaign_key, user_id),
  constraint subscription_campaign_entries_draw_number_unique
    unique (draw_number)
);

create index if not exists subscription_campaign_entries_campaign_idx
  on public.subscription_campaign_entries (campaign_key, created_at desc);

create index if not exists subscription_campaign_entries_status_idx
  on public.subscription_campaign_entries (campaign_key, status);

create or replace function public.set_subscription_campaign_entries_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_subscription_campaign_entries_updated_at
  on public.subscription_campaign_entries;

create trigger trg_subscription_campaign_entries_updated_at
  before update on public.subscription_campaign_entries
  for each row
  execute function public.set_subscription_campaign_entries_updated_at();

alter table public.subscription_campaign_entries enable row level security;

drop policy if exists "Users can view own campaign entries"
  on public.subscription_campaign_entries;

create policy "Users can view own campaign entries"
  on public.subscription_campaign_entries for select
  using (auth.uid() = user_id);
