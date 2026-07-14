-- アバター保存用バケットの作成
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- 既存ポリシーの削除（エラー回避のため）
drop policy if exists "Public Access Avatars" on storage.objects;
drop policy if exists "Authenticated Upload Avatars" on storage.objects;
drop policy if exists "Authenticated Update Avatars" on storage.objects;
drop policy if exists "Authenticated Delete Avatars" on storage.objects;

-- ポリシーの設定
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
