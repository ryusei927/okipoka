-- gacha_items に limit_per_user カラムを追加
ALTER TABLE public.gacha_items
ADD COLUMN IF NOT EXISTS limit_per_user INTEGER;

COMMENT ON COLUMN public.gacha_items.limit_per_user IS '1ユーザーあたりの当選上限数（NULLは無制限）';
