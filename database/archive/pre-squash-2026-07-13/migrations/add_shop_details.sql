-- 店舗テーブルに基本情報を追加
alter table public.shops add column if not exists address text;
alter table public.shops add column if not exists opening_hours text;
alter table public.shops add column if not exists google_map_url text;
