-- gacha_items に is_monthly_limit カラムを追加
ALTER TABLE public.gacha_items
ADD COLUMN IF NOT EXISTS is_monthly_limit BOOLEAN DEFAULT false;

COMMENT ON COLUMN public.gacha_items.is_monthly_limit IS '在庫とユーザー上限を毎月リセットするかどうか';
