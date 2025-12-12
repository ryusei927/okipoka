-- 店舗テーブルにエリア情報を追加
alter table public.shops add column if not exists area text;
