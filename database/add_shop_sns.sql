-- 店舗テーブルにSNSリンクとWebサイトの情報を追加
ALTER TABLE public.shops
ADD COLUMN IF NOT EXISTS instagram_url text,
ADD COLUMN IF NOT EXISTS twitter_url text,
ADD COLUMN IF NOT EXISTS website_url text;
