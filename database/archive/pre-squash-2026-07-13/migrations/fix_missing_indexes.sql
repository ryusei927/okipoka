-- Performance Advisorの「Unindexed foreign keys」警告に対応するためのインデックス作成SQL
-- 外部キー（Foreign Key）にインデックスを作成することで、JOINや検索のパフォーマンスが向上します。

-- 1. public.shops
-- owner_id が auth.users を参照しているためインデックスを作成
CREATE INDEX IF NOT EXISTS idx_shops_owner_id ON public.shops(owner_id);

-- 2. public.tournaments
-- shop_id が public.shops を参照しているためインデックスを作成
CREATE INDEX IF NOT EXISTS idx_tournaments_shop_id ON public.tournaments(shop_id);

-- 3. public.gacha_items
-- shop_id が public.shops を参照しているためインデックスを作成
CREATE INDEX IF NOT EXISTS idx_gacha_items_shop_id ON public.gacha_items(shop_id);

-- 4. public.user_items
-- user_id が auth.users を参照しているためインデックスを作成
CREATE INDEX IF NOT EXISTS idx_user_items_user_id ON public.user_items(user_id);
-- item_id が public.gacha_items を参照しているためインデックスを作成
CREATE INDEX IF NOT EXISTS idx_user_items_item_id ON public.user_items(item_id);

-- 5. public.gacha_logs
-- user_id が auth.users を参照しているためインデックスを作成
CREATE INDEX IF NOT EXISTS idx_gacha_logs_user_id ON public.gacha_logs(user_id);
-- item_id が public.gacha_items を参照しているためインデックスを作成
CREATE INDEX IF NOT EXISTS idx_gacha_logs_item_id ON public.gacha_logs(item_id);
