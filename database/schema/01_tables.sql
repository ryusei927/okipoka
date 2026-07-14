-- ============================================================
-- 01_tables.sql
-- Current production schema (greenfield): types, tables, columns,
-- indexes, constraints, and schema-security triggers/functions.
--
-- Excludes: premium_codes / premium_code_attempts / redeem_premium_code
--   (see migrations/create_premium_codes.sql)
-- Excludes: seed data (see schema/seed.sql)
-- Excludes RPC bodies that live in database/functions/ — see comments
--   at the bottom of this file.
-- ============================================================

-- ------------------------------------------------------------
-- Types
-- ------------------------------------------------------------
create type public.shop_plan as enum ('free', 'business', 'premium');

create type public.ad_type as enum ('banner', 'square', 'story', 'card');

-- ------------------------------------------------------------
-- shops
-- ------------------------------------------------------------
create table if not exists public.shops (
  id uuid not null default gen_random_uuid() primary key,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  name text not null,
  slug text not null unique,
  plan public.shop_plan not null default 'free',

  -- Business+
  image_url text,
  is_vacant boolean default true, -- unused in app; kept for schema compatibility

  -- Premium+ / details
  description text,
  website_url text,
  instagram_url text,
  twitter_url text,
  area text,
  address text,
  opening_hours text,
  google_map_url text,
  photo_url text,
  phone text,

  owner_id uuid references auth.users(id)
);

create index if not exists idx_shops_owner_id on public.shops(owner_id);

-- ------------------------------------------------------------
-- tournaments
-- ------------------------------------------------------------
create table if not exists public.tournaments (
  id uuid not null default gen_random_uuid() primary key,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  shop_id uuid not null references public.shops(id) on delete cascade,

  title text not null,
  start_at timestamptz not null,
  end_at timestamptz,

  buy_in text,
  stack text,
  blind text,

  tags text[] default '{}',
  details jsonb default '{}'::jsonb,

  late_reg_at timestamptz,
  reentry_fee text,
  addon_fee text,
  prizes text,
  notes text,
  type text default 'トーナメント',

  is_template boolean default false,

  addon_status text default 'unknown', -- 'available' | 'unavailable' | 'unknown'
  addon_stack text
);

create index if not exists idx_tournaments_shop_id on public.tournaments(shop_id);

-- ------------------------------------------------------------
-- profiles
-- ------------------------------------------------------------
create table if not exists public.profiles (
  id uuid not null references auth.users(id) on delete cascade primary key,
  created_at timestamptz not null default now(),

  display_name text,
  avatar_url text,

  is_vip boolean not null default false,
  vip_since timestamptz,          -- unused in app; kept for schema compatibility
  vip_expires_at timestamptz,     -- unused in app; kept for schema compatibility

  square_customer_id text,
  subscription_id text,
  subscription_status text default 'inactive', -- active | inactive | past_due | canceled | canceling
  last_gacha_at timestamptz,

  payment_method text,            -- 'card' | 'cash' | etc.
  subscription_expires_at date    -- cash membership expiry
);

create index if not exists idx_profiles_payment_method on public.profiles(payment_method);

-- ------------------------------------------------------------
-- gacha_items / user_items / gacha_logs
-- ------------------------------------------------------------
create table if not exists public.gacha_items (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  image_url text,
  probability integer not null,
  type text not null, -- 'drink_ticket' | 'discount_coupon' | 'other' | ('none' historically soft-deleted)
  value integer,
  cost_yen integer not null default 0,
  expires_days integer not null default 30,
  stock_total integer,
  stock_used integer not null default 0,
  is_active boolean default true,
  deleted_at timestamptz,
  created_at timestamptz default now(),

  shop_id uuid references public.shops(id) on delete set null,
  limit_per_user integer,         -- NULL = unlimited
  is_monthly_limit boolean default false,

  constraint gacha_items_stock_nonnegative check (
    (stock_total is null or stock_total >= 0)
    and stock_used >= 0
    and (stock_total is null or stock_used <= stock_total)
  ),
  constraint gacha_items_expires_days_nonnegative check (expires_days >= 0)
);

comment on column public.gacha_items.limit_per_user is '1ユーザーあたりの当選上限数（NULLは無制限）';
comment on column public.gacha_items.is_monthly_limit is '在庫とユーザー上限を毎月リセットするかどうか';

create index if not exists idx_gacha_items_shop_id on public.gacha_items(shop_id);

create table if not exists public.user_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  item_id uuid references public.gacha_items(id),
  is_used boolean default false,
  used_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz default now()
);

create index if not exists idx_user_items_user_id on public.user_items(user_id);
create index if not exists idx_user_items_item_id on public.user_items(item_id);

create table if not exists public.gacha_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  item_id uuid references public.gacha_items(id),
  created_at timestamptz default now()
);

create index if not exists idx_gacha_logs_user_id on public.gacha_logs(user_id);
create index if not exists idx_gacha_logs_item_id on public.gacha_logs(item_id);

-- ------------------------------------------------------------
-- featured_items
-- ------------------------------------------------------------
create table if not exists public.featured_items (
  id uuid not null default gen_random_uuid() primary key,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  image_url text not null,
  link_url text,
  alt_text text,

  is_active boolean not null default true
);

-- ------------------------------------------------------------
-- ad_subscriptions (before ads FK)
-- ------------------------------------------------------------
create table if not exists public.ad_subscriptions (
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
  desired_ad_type text,
  link_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists ad_subscriptions_email_idx on public.ad_subscriptions (email);
create index if not exists ad_subscriptions_subscription_idx on public.ad_subscriptions (square_subscription_id);

-- ------------------------------------------------------------
-- ads
-- ------------------------------------------------------------
create table if not exists public.ads (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  image_url text not null,
  link_url text,
  type public.ad_type not null default 'banner',
  description text,
  is_active boolean default true,
  priority integer default 0,
  start_at timestamptz,
  end_at timestamptz,
  click_count integer default 0,
  impression_count integer default 0,
  ad_subscription_id uuid references public.ad_subscriptions(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists ads_ad_subscription_idx on public.ads (ad_subscription_id);

-- ------------------------------------------------------------
-- ad_metrics (daily JST aggregates)
-- ------------------------------------------------------------
create table if not exists public.ad_metrics (
  ad_id uuid not null references public.ads(id) on delete cascade,
  day date not null,
  impressions integer not null default 0,
  clicks integer not null default 0,
  primary key (ad_id, day)
);

create index if not exists ad_metrics_day_idx on public.ad_metrics (day);

-- ------------------------------------------------------------
-- hands / hand_comments / hand_likes
-- ------------------------------------------------------------
create table if not exists public.hands (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,

  game_type text not null default 'NLH',
  sb integer not null default 100,
  bb integer not null default 200,
  ante integer default 0,
  max_players integer not null default 9,

  hero_position text not null,
  hero_card1_rank text not null,
  hero_card1_suit text not null,
  hero_card2_rank text not null,
  hero_card2_suit text not null,
  hero_stack_bb numeric(10,2) not null default 100,

  board jsonb default '[]'::jsonb,
  preflop_actions jsonb default '[]'::jsonb,
  flop_actions jsonb default '[]'::jsonb,
  turn_actions jsonb default '[]'::jsonb,
  river_actions jsonb default '[]'::jsonb,

  result text,
  profit_bb numeric(10,2),

  memo text,
  title text,
  is_public boolean not null default true,

  villain_cards jsonb,

  shop_id uuid references public.shops(id),
  tournament_name text,

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists hands_user_id_idx on public.hands(user_id);
create index if not exists hands_created_at_idx on public.hands(created_at desc);
create index if not exists hands_is_public_idx on public.hands(is_public) where is_public = true;

create table if not exists public.hand_comments (
  id uuid primary key default gen_random_uuid(),
  hand_id uuid references public.hands(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  content text not null,
  created_at timestamptz default now()
);

create index if not exists hand_comments_hand_id_idx on public.hand_comments(hand_id);

create table if not exists public.hand_likes (
  id uuid primary key default gen_random_uuid(),
  hand_id uuid references public.hands(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  created_at timestamptz default now(),
  unique(hand_id, user_id)
);

create index if not exists hand_likes_hand_id_idx on public.hand_likes(hand_id);

-- ------------------------------------------------------------
-- photo_albums / photo_album_photos
-- ------------------------------------------------------------
create table if not exists public.photo_albums (
  id uuid not null default gen_random_uuid() primary key,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  title text not null,
  description text,
  cover_image_url text,
  event_date date not null,
  is_published boolean not null default false,

  photo_count integer not null default 0
);

create table if not exists public.photo_album_photos (
  id uuid not null default gen_random_uuid() primary key,
  created_at timestamptz not null default now(),

  album_id uuid not null references public.photo_albums(id) on delete cascade,
  image_url text not null,
  thumbnail_url text,
  caption text,
  sort_order integer not null default 0
);

create index if not exists idx_photo_albums_event_date on public.photo_albums(event_date desc);
create index if not exists idx_photo_albums_published on public.photo_albums(is_published);
create index if not exists idx_photo_album_photos_album_id on public.photo_album_photos(album_id);
create index if not exists idx_photo_album_photos_sort_order on public.photo_album_photos(album_id, sort_order);

-- ------------------------------------------------------------
-- chat_logs
-- ------------------------------------------------------------
create table if not exists public.chat_logs (
  id uuid not null default gen_random_uuid(),
  user_id uuid references auth.users(id),
  role text not null,
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  session_id text,
  primary key (id)
);

-- ------------------------------------------------------------
-- tournament_favorites (unused in app; kept for schema compatibility)
-- ------------------------------------------------------------
create table if not exists public.tournament_favorites (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  tournament_id uuid references public.tournaments(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  notified_at timestamp with time zone,
  unique(user_id, tournament_id)
);

-- ------------------------------------------------------------
-- push_subscriptions (unused in app; kept for schema compatibility)
-- ------------------------------------------------------------
create table if not exists public.push_subscriptions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  endpoint text not null,
  p256dh text not null,
  auth text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, endpoint)
);

-- ------------------------------------------------------------
-- subscription_campaign_entries (consent fields merged)
-- ------------------------------------------------------------
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
  publicity_consent_at timestamptz,
  prize_contact_consent_at timestamptz,
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

-- ------------------------------------------------------------
-- Schema-security triggers / functions (from migrations only;
-- not duplicated in database/functions/)
-- ------------------------------------------------------------

-- profiles: block browser clients from rewriting billing/VIP columns
create or replace function public.protect_profile_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is not null then
    new.subscription_status     := old.subscription_status;
    new.subscription_id         := old.subscription_id;
    new.square_customer_id      := old.square_customer_id;
    new.payment_method          := old.payment_method;
    new.subscription_expires_at := old.subscription_expires_at;
    new.is_vip                  := old.is_vip;
    new.vip_since               := old.vip_since;
    new.vip_expires_at          := old.vip_expires_at;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_protect_profile_columns on public.profiles;
create trigger trg_protect_profile_columns
  before update on public.profiles
  for each row
  execute function public.protect_profile_columns();

-- Coupon redeem RPC (spin_gacha grants items; clients must not UPDATE user_items directly)
create or replace function public.use_coupon(p_item_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_item record;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Unauthorized';
  end if;

  select *
    into v_item
  from public.user_items
  where id = p_item_id
    and user_id = v_user_id
  for update;

  if not found then
    raise exception 'Item not found';
  end if;

  if v_item.is_used then
    raise exception 'Already used';
  end if;

  if v_item.expires_at is not null and v_item.expires_at < now() then
    raise exception 'Expired';
  end if;

  update public.user_items
     set is_used = true,
         used_at = now()
   where id = p_item_id
     and user_id = v_user_id
     and is_used = false;

  return jsonb_build_object('success', true, 'id', p_item_id, 'used_at', now());
end;
$$;

revoke all on function public.use_coupon(uuid) from public;
grant execute on function public.use_coupon(uuid) to authenticated;

-- ============================================================
-- RPC / function bodies that live in database/functions/
-- (do NOT redefine here — apply those files separately)
-- ============================================================
-- database/functions/spin_gacha.sql
-- database/functions/create_get_public_gacha_items.sql
-- database/functions/fix_get_admin_gacha_items_jst.sql
-- database/functions/fix_cash_subscription_expiry.sql  (expire_cash_subscriptions)
-- database/functions/create_ad_tracking_functions.sql    (track_ad_impression / track_ad_click)
