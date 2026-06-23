-- 画像保存用のバケットを作成
insert into storage.buckets (id, name, public)
values ('shop-images', 'shop-images', true)
on conflict (id) do nothing;

-- ポリシーの設定（誰でも見れる、ログインユーザーならアップロード・更新・削除可能）
create policy "Public Access"
  on storage.objects for select
  using ( bucket_id = 'shop-images' );

create policy "Authenticated Upload"
  on storage.objects for insert
  with check ( bucket_id = 'shop-images' and auth.role() = 'authenticated' );

create policy "Authenticated Update"
  on storage.objects for update
  using ( bucket_id = 'shop-images' and auth.role() = 'authenticated' );

create policy "Authenticated Delete"
  on storage.objects for delete
  using ( bucket_id = 'shop-images' and auth.role() = 'authenticated' );
