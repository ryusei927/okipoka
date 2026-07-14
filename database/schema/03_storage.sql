-- ============================================================
-- 03_storage.sql
-- Storage buckets + policies: final state of storage.sql,
-- add_avatars_bucket / fix_all_policies (avatars), and
-- fix_storage_policy (shop-images open write).
-- Also includes ads + player-photos buckets from schema creates
-- (part of current production storage).
-- Apply after 01_tables.sql / 02_policies.sql (order flexible vs RLS).
-- ============================================================

-- ------------------------------------------------------------
-- Buckets
-- ------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('shop-images', 'shop-images', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('ads', 'ads', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'player-photos',
  'player-photos',
  true,
  52428800, -- 50MB
  array['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/heic', 'image/heif']
)
on conflict (id) do update set
  file_size_limit = 52428800,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/heic', 'image/heif'];

-- ------------------------------------------------------------
-- shop-images
-- Final: public select + public insert/update/delete (fix_storage_policy)
-- ------------------------------------------------------------
drop policy if exists "Public Access" on storage.objects;
drop policy if exists "Authenticated Upload" on storage.objects;
drop policy if exists "Authenticated Update" on storage.objects;
drop policy if exists "Authenticated Delete" on storage.objects;
drop policy if exists "Public Upload" on storage.objects;
drop policy if exists "Public Update" on storage.objects;
drop policy if exists "Public Delete" on storage.objects;

create policy "Public Access"
  on storage.objects for select
  using (bucket_id = 'shop-images');

create policy "Public Upload"
  on storage.objects for insert
  with check (bucket_id = 'shop-images');

create policy "Public Update"
  on storage.objects for update
  using (bucket_id = 'shop-images');

create policy "Public Delete"
  on storage.objects for delete
  using (bucket_id = 'shop-images');

-- ------------------------------------------------------------
-- avatars
-- Final: public select + authenticated write (add_avatars_bucket / fix_all_policies)
-- ------------------------------------------------------------
drop policy if exists "Public Access Avatars" on storage.objects;
drop policy if exists "Authenticated Upload Avatars" on storage.objects;
drop policy if exists "Authenticated Update Avatars" on storage.objects;
drop policy if exists "Authenticated Delete Avatars" on storage.objects;

create policy "Public Access Avatars"
  on storage.objects for select
  using (bucket_id = 'avatars');

create policy "Authenticated Upload Avatars"
  on storage.objects for insert
  with check (bucket_id = 'avatars' and auth.role() = 'authenticated');

create policy "Authenticated Update Avatars"
  on storage.objects for update
  using (bucket_id = 'avatars' and auth.role() = 'authenticated');

create policy "Authenticated Delete Avatars"
  on storage.objects for delete
  using (bucket_id = 'avatars' and auth.role() = 'authenticated');

-- ------------------------------------------------------------
-- ads
-- ------------------------------------------------------------
drop policy if exists "Ad images are publicly accessible" on storage.objects;
drop policy if exists "Admins can upload ad images" on storage.objects;
drop policy if exists "Admins can update ad images" on storage.objects;
drop policy if exists "Admins can delete ad images" on storage.objects;

create policy "Ad images are publicly accessible"
  on storage.objects for select
  using (bucket_id = 'ads');

create policy "Admins can upload ad images"
  on storage.objects for insert
  with check (bucket_id = 'ads' and auth.role() = 'authenticated');

create policy "Admins can update ad images"
  on storage.objects for update
  using (bucket_id = 'ads' and auth.role() = 'authenticated');

create policy "Admins can delete ad images"
  on storage.objects for delete
  using (bucket_id = 'ads' and auth.role() = 'authenticated');

-- ------------------------------------------------------------
-- player-photos
-- ------------------------------------------------------------
drop policy if exists "Public Access for player-photos" on storage.objects;
drop policy if exists "Authenticated Upload for player-photos" on storage.objects;
drop policy if exists "Authenticated Update for player-photos" on storage.objects;
drop policy if exists "Authenticated Delete for player-photos" on storage.objects;

create policy "Public Access for player-photos"
  on storage.objects for select
  using (bucket_id = 'player-photos');

create policy "Authenticated Upload for player-photos"
  on storage.objects for insert
  with check (bucket_id = 'player-photos' and auth.role() = 'authenticated');

create policy "Authenticated Update for player-photos"
  on storage.objects for update
  using (bucket_id = 'player-photos' and auth.role() = 'authenticated');

create policy "Authenticated Delete for player-photos"
  on storage.objects for delete
  using (bucket_id = 'player-photos' and auth.role() = 'authenticated');
