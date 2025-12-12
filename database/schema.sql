-- 店舗テーブル
create type shop_plan as enum ('free', 'business', 'premium');

create table public.shops (
  id uuid not null default gen_random_uuid() primary key,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  
  name text not null,
  slug text not null unique, -- URL用ID
  plan shop_plan not null default 'free',
  
  -- Businessプラン以上
  image_url text,
  is_vacant boolean default true, -- 空席あり: true, 満卓: false
  
  -- Premiumプラン以上
  description text, -- リッチテキスト想定
  website_url text,
  instagram_url text,
  twitter_url text,
  
  owner_id uuid references auth.users(id) -- 店舗オーナーの紐付け
);

-- トーナメントテーブル
create table public.tournaments (
  id uuid not null default gen_random_uuid() primary key,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  
  shop_id uuid not null references public.shops(id) on delete cascade,
  
  title text not null,
  start_at timestamptz not null,
  end_at timestamptz,
  
  buy_in text, -- "3,000円" や "早割 30,000円" など柔軟に
  stack text,
  blind text,
  
  tags text[] default '{}', -- "トーナメント", "リング", "初心者講習" など
  
  -- 詳細情報
  details jsonb default '{}'::jsonb -- その他の細かい情報はJSONで持つ
);

-- ユーザープロフィール（VIP管理）
create table public.profiles (
  id uuid not null references auth.users(id) on delete cascade primary key,
  created_at timestamptz not null default now(),
  
  display_name text,
  avatar_url text,
  
  is_vip boolean not null default false,
  vip_since timestamptz,
  vip_expires_at timestamptz
);

-- RLS (Row Level Security) の有効化
alter table public.shops enable row level security;
alter table public.tournaments enable row level security;
alter table public.profiles enable row level security;

-- ポリシー例（後で詳細設定）
-- 誰でも店舗情報は閲覧可能
create policy "Public shops are viewable by everyone." on public.shops for select using (true);
-- 誰でもトーナメント情報は閲覧可能
create policy "Public tournaments are viewable by everyone." on public.tournaments for select using (true);
