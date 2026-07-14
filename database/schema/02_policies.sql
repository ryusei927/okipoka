-- ============================================================
-- 02_policies.sql
-- Final RLS policies after fix_db_policy, fix_all_policies,
-- fix_profiles_policy, harden_member_security, ads/campaign policies, etc.
-- Apply after 01_tables.sql.
-- ============================================================

-- ------------------------------------------------------------
-- Enable RLS
-- ------------------------------------------------------------
alter table public.shops enable row level security;
alter table public.tournaments enable row level security;
alter table public.profiles enable row level security;
alter table public.gacha_items enable row level security;
alter table public.user_items enable row level security;
alter table public.gacha_logs enable row level security;
alter table public.featured_items enable row level security;
alter table public.ads enable row level security;
alter table public.ad_subscriptions enable row level security;
alter table public.ad_metrics enable row level security;
alter table public.hands enable row level security;
alter table public.hand_comments enable row level security;
alter table public.hand_likes enable row level security;
alter table public.photo_albums enable row level security;
alter table public.photo_album_photos enable row level security;
alter table public.chat_logs enable row level security;
alter table public.tournament_favorites enable row level security;
alter table public.push_subscriptions enable row level security;
alter table public.subscription_campaign_entries enable row level security;

-- ------------------------------------------------------------
-- shops
-- ------------------------------------------------------------
drop policy if exists "Public shops are viewable by everyone." on public.shops;
drop policy if exists "Enable insert for everyone" on public.shops;
drop policy if exists "Enable update for everyone" on public.shops;
drop policy if exists "Enable delete for everyone" on public.shops;

create policy "Public shops are viewable by everyone."
  on public.shops for select
  using (true);

create policy "Enable insert for everyone"
  on public.shops for insert
  with check (true);

create policy "Enable update for everyone"
  on public.shops for update
  using (true);

create policy "Enable delete for everyone"
  on public.shops for delete
  using (true);

-- ------------------------------------------------------------
-- tournaments
-- ------------------------------------------------------------
drop policy if exists "Public tournaments are viewable by everyone." on public.tournaments;
drop policy if exists "Enable insert for everyone" on public.tournaments;
drop policy if exists "Enable update for everyone" on public.tournaments;
drop policy if exists "Enable delete for everyone" on public.tournaments;

create policy "Public tournaments are viewable by everyone."
  on public.tournaments for select
  using (true);

create policy "Enable insert for everyone"
  on public.tournaments for insert
  with check (true);

create policy "Enable update for everyone"
  on public.tournaments for update
  using (true);

create policy "Enable delete for everyone"
  on public.tournaments for delete
  using (true);

-- ------------------------------------------------------------
-- profiles (final: own + admin select; own insert/update)
-- ------------------------------------------------------------
drop policy if exists "Public profiles are viewable by everyone." on public.profiles;
drop policy if exists "Users can view own profile." on public.profiles;
drop policy if exists "Admin can view all profiles." on public.profiles;
drop policy if exists "Users can update own profile." on public.profiles;
drop policy if exists "Users can insert own profile." on public.profiles;

create policy "Users can view own profile."
  on public.profiles for select
  using (auth.uid() = id);

create policy "Admin can view all profiles."
  on public.profiles for select
  using ((auth.jwt() ->> 'email') = 'okipoka.jp@gmail.com');

create policy "Users can update own profile."
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can insert own profile."
  on public.profiles for insert
  with check (auth.uid() = id);

-- ------------------------------------------------------------
-- gacha_items
-- ------------------------------------------------------------
drop policy if exists "Anyone can view active gacha items" on public.gacha_items;
drop policy if exists "Admin can view all gacha items" on public.gacha_items;
drop policy if exists "Admin can manage gacha items" on public.gacha_items;

create policy "Anyone can view active gacha items"
  on public.gacha_items for select
  using (is_active = true);

create policy "Admin can view all gacha items"
  on public.gacha_items for select
  using ((auth.jwt() ->> 'email') = 'okipoka.jp@gmail.com');

create policy "Admin can manage gacha items"
  on public.gacha_items for all
  using ((auth.jwt() ->> 'email') = 'okipoka.jp@gmail.com')
  with check ((auth.jwt() ->> 'email') = 'okipoka.jp@gmail.com');

-- ------------------------------------------------------------
-- user_items (harden_member_security: no direct INSERT/UPDATE by users)
-- ------------------------------------------------------------
drop policy if exists "Users can view their own items" on public.user_items;
drop policy if exists "Admin can view all user items" on public.user_items;
drop policy if exists "Users can insert their own items" on public.user_items;
drop policy if exists "Users can update their own items" on public.user_items;

create policy "Users can view their own items"
  on public.user_items for select
  using (auth.uid() = user_id);

create policy "Admin can view all user items"
  on public.user_items for select
  using ((auth.jwt() ->> 'email') = 'okipoka.jp@gmail.com');

-- Inserts via spin_gacha(); updates via use_coupon() (both SECURITY DEFINER).

-- ------------------------------------------------------------
-- gacha_logs
-- ------------------------------------------------------------
drop policy if exists "Users can view their own logs" on public.gacha_logs;
drop policy if exists "Users can insert their own logs" on public.gacha_logs;

create policy "Users can view their own logs"
  on public.gacha_logs for select
  using (auth.uid() = user_id);

create policy "Users can insert their own logs"
  on public.gacha_logs for insert
  with check (auth.uid() = user_id);

-- ------------------------------------------------------------
-- featured_items
-- ------------------------------------------------------------
drop policy if exists "Public featured items are viewable by everyone." on public.featured_items;
drop policy if exists "Admins can manage featured items" on public.featured_items;

create policy "Public featured items are viewable by everyone."
  on public.featured_items for select
  using (true);

create policy "Admins can manage featured items"
  on public.featured_items for all
  using (auth.role() = 'authenticated');

-- ------------------------------------------------------------
-- ads
-- ------------------------------------------------------------
drop policy if exists "Public ads are viewable by everyone" on public.ads;
drop policy if exists "Admins can manage ads" on public.ads;

create policy "Public ads are viewable by everyone"
  on public.ads for select
  using (true);

create policy "Admins can manage ads"
  on public.ads for all
  using (auth.role() = 'authenticated');

-- ------------------------------------------------------------
-- ad_subscriptions
-- ------------------------------------------------------------
drop policy if exists "Admins can view ad subscriptions" on public.ad_subscriptions;

create policy "Admins can view ad subscriptions"
  on public.ad_subscriptions for select
  using (auth.role() = 'authenticated');

-- Writes via service role (RLS bypass).

-- ------------------------------------------------------------
-- ad_metrics
-- ------------------------------------------------------------
drop policy if exists "Admins can view ad metrics" on public.ad_metrics;

create policy "Admins can view ad metrics"
  on public.ad_metrics for select
  using (auth.role() = 'authenticated');

-- Writes via track_ad_* / service role.

-- ------------------------------------------------------------
-- hands
-- ------------------------------------------------------------
drop policy if exists "Users can manage their own hands" on public.hands;
drop policy if exists "Anyone can view public hands" on public.hands;

create policy "Users can manage their own hands"
  on public.hands for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Anyone can view public hands"
  on public.hands for select
  using (is_public = true);

-- ------------------------------------------------------------
-- hand_comments
-- ------------------------------------------------------------
drop policy if exists "Anyone can view comments on public hands" on public.hand_comments;
drop policy if exists "Authenticated users can add comments" on public.hand_comments;
drop policy if exists "Users can delete their own comments" on public.hand_comments;

create policy "Anyone can view comments on public hands"
  on public.hand_comments for select
  using (
    exists (
      select 1 from public.hands
      where hands.id = hand_comments.hand_id and hands.is_public = true
    )
    or auth.uid() = user_id
  );

create policy "Authenticated users can add comments"
  on public.hand_comments for insert
  with check (auth.uid() = user_id);

create policy "Users can delete their own comments"
  on public.hand_comments for delete
  using (auth.uid() = user_id);

-- ------------------------------------------------------------
-- hand_likes
-- ------------------------------------------------------------
drop policy if exists "Users can manage their own likes" on public.hand_likes;
drop policy if exists "Anyone can view likes count" on public.hand_likes;

create policy "Users can manage their own likes"
  on public.hand_likes for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Anyone can view likes count"
  on public.hand_likes for select
  using (true);

-- ------------------------------------------------------------
-- photo_albums / photo_album_photos
-- ------------------------------------------------------------
drop policy if exists "Published albums are viewable by everyone" on public.photo_albums;
drop policy if exists "Published album photos are viewable by everyone" on public.photo_album_photos;

create policy "Published albums are viewable by everyone"
  on public.photo_albums for select
  using (is_published = true);

create policy "Published album photos are viewable by everyone"
  on public.photo_album_photos for select
  using (
    exists (
      select 1 from public.photo_albums
      where id = photo_album_photos.album_id
        and is_published = true
    )
  );

-- ------------------------------------------------------------
-- chat_logs
-- ------------------------------------------------------------
drop policy if exists "Enable insert for everyone" on public.chat_logs;
drop policy if exists "Enable select for admins only" on public.chat_logs;

create policy "Enable insert for everyone"
  on public.chat_logs for insert
  with check (true);

create policy "Enable select for admins only"
  on public.chat_logs for select
  using (true); -- historically open; tighten in production if needed

-- ------------------------------------------------------------
-- tournament_favorites
-- ------------------------------------------------------------
drop policy if exists "Users can view their own favorites" on public.tournament_favorites;
drop policy if exists "Users can insert their own favorites" on public.tournament_favorites;
drop policy if exists "Users can delete their own favorites" on public.tournament_favorites;

create policy "Users can view their own favorites"
  on public.tournament_favorites for select
  using (auth.uid() = user_id);

create policy "Users can insert their own favorites"
  on public.tournament_favorites for insert
  with check (auth.uid() = user_id);

create policy "Users can delete their own favorites"
  on public.tournament_favorites for delete
  using (auth.uid() = user_id);

-- ------------------------------------------------------------
-- push_subscriptions
-- ------------------------------------------------------------
drop policy if exists "Users can insert their own subscriptions" on public.push_subscriptions;
drop policy if exists "Users can delete their own subscriptions" on public.push_subscriptions;

create policy "Users can insert their own subscriptions"
  on public.push_subscriptions for insert
  with check (auth.uid() = user_id);

create policy "Users can delete their own subscriptions"
  on public.push_subscriptions for delete
  using (auth.uid() = user_id);

-- ------------------------------------------------------------
-- subscription_campaign_entries
-- ------------------------------------------------------------
drop policy if exists "Users can view own campaign entries" on public.subscription_campaign_entries;

create policy "Users can view own campaign entries"
  on public.subscription_campaign_entries for select
  using (auth.uid() = user_id);

-- Writes via service role (RLS bypass).
