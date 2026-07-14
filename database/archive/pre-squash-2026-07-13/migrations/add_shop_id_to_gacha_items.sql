-- gacha_items に shop_id を追加
ALTER TABLE public.gacha_items
ADD COLUMN IF NOT EXISTS shop_id UUID REFERENCES public.shops(id) ON DELETE SET NULL;
