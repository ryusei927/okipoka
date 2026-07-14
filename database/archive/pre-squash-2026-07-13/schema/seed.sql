-- 既存データをクリア
truncate table public.shops cascade;

-- 店舗データの挿入
insert into public.shops (name, slug, plan, image_url) values
('UnderTheGun', 'utg', 'premium', 'https://placehold.co/600x400/orange/white?text=UTG'),
('TheHand', 'thehand', 'business', null),
('Re:Raise', 'reraise', 'premium', 'https://placehold.co/600x400/blue/white?text=ReRaise'),
('THE NUTS', 'thenuts', 'free', null),
('JACKS', 'jacks', 'free', null);

-- 既存データをクリア
truncate table public.tournaments cascade;

-- 店舗IDを取得して挿入（タイムゾーンをJST +09 で指定）
with shop_utg as (select id from public.shops where slug = 'utg'),
     shop_hand as (select id from public.shops where slug = 'thehand'),
     shop_reraise as (select id from public.shops where slug = 'reraise'),
     shop_nuts as (select id from public.shops where slug = 'thenuts'),
     shop_jacks as (select id from public.shops where slug = 'jacks')

insert into public.tournaments (shop_id, title, start_at, buy_in, tags) values
((select id from shop_utg), 'KING HIGH ROLLER HOUSE杯', (current_date || ' 19:30:00+09')::timestamptz, '早割有 30,000円', ARRAY['トーナメント']),
((select id from shop_hand), '㊙プライズ 1卓限定', (current_date || ' 19:30:00+09')::timestamptz, '2,500円', ARRAY['トーナメント']),
((select id from shop_reraise), '準世界遺産認定宮城きゃっぱれMTT', (current_date || ' 20:00:00+09')::timestamptz, '5,000円', ARRAY['トーナメント']),
((select id from shop_nuts), 'フリーパストーナメント', (current_date || ' 21:00:00+09')::timestamptz, '4,000円', ARRAY['トーナメント']),
((select id from shop_jacks), '金曜トナメ', (current_date || ' 21:00:00+09')::timestamptz, '3,000円', ARRAY['トーナメント']);
