-- 既存の厳格なポリシーを削除
drop policy if exists "Authenticated Upload" on storage.objects;
drop policy if exists "Authenticated Update" on storage.objects;
drop policy if exists "Authenticated Delete" on storage.objects;

-- 既存の公開ポリシーも削除（エラー回避のため）
drop policy if exists "Public Upload" on storage.objects;
drop policy if exists "Public Update" on storage.objects;
drop policy if exists "Public Delete" on storage.objects;

-- 誰でもアップロード・更新・削除できるようにする（開発用）
-- 注意: 本番環境では適切な認証制限を設けることを推奨します
create policy "Public Upload"
  on storage.objects for insert
  with check ( bucket_id = 'shop-images' );

create policy "Public Update"
  on storage.objects for update
  using ( bucket_id = 'shop-images' );

create policy "Public Delete"
  on storage.objects for delete
  using ( bucket_id = 'shop-images' );
