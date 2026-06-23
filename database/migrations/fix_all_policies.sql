-- ==============================================
-- 1. Storage (Avatars) の設定
-- ==============================================

-- バケット作成
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- Storageポリシーのクリーンアップ
drop policy if exists "Public Access Avatars" on storage.objects;
drop policy if exists "Authenticated Upload Avatars" on storage.objects;
drop policy if exists "Authenticated Update Avatars" on storage.objects;
drop policy if exists "Authenticated Delete Avatars" on storage.objects;

-- Storageポリシーの再作成
create policy "Public Access Avatars"
  on storage.objects for select
  using ( bucket_id = 'avatars' );

create policy "Authenticated Upload Avatars"
  on storage.objects for insert
  with check ( bucket_id = 'avatars' and auth.role() = 'authenticated' );

create policy "Authenticated Update Avatars"
  on storage.objects for update
  using ( bucket_id = 'avatars' and auth.role() = 'authenticated' );

create policy "Authenticated Delete Avatars"
  on storage.objects for delete
  using ( bucket_id = 'avatars' and auth.role() = 'authenticated' );


-- ==============================================
-- 2. Database (Profiles) の設定
-- ==============================================

-- RLSの有効化（念のため）
alter table public.profiles enable row level security;

-- Profilesポリシーのクリーンアップ
drop policy if exists "Public profiles are viewable by everyone." on public.profiles;
drop policy if exists "Users can update own profile." on public.profiles;
drop policy if exists "Users can insert own profile." on public.profiles;

-- Profilesポリシーの再作成
create policy "Public profiles are viewable by everyone."
  on public.profiles for select
  using ( true );

create policy "Users can update own profile."
  on public.profiles for update
  using ( auth.uid() = id );

create policy "Users can insert own profile."
  on public.profiles for insert
  with check ( auth.uid() = id );
