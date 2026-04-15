-- 店舗テーブルに写真URLと電話番号を追加
alter table public.shops add column if not exists photo_url text;
alter table public.shops add column if not exists phone text;
