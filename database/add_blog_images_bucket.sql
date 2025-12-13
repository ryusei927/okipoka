-- blog 画像用の Storage バケット
insert into storage.buckets (id, name, public)
values ('blog-images', 'blog-images', true)
on conflict (id) do nothing;

-- 既存ポリシーがある場合に備えて削除（再実行可能にする）
drop policy if exists "Blog Images Public Read" on storage.objects;
drop policy if exists "Blog Images Service Role Upload" on storage.objects;
drop policy if exists "Blog Images Service Role Update" on storage.objects;
drop policy if exists "Blog Images Service Role Delete" on storage.objects;

-- 誰でも閲覧OK
create policy "Blog Images Public Read"
  on storage.objects for select
  using (bucket_id = 'blog-images');

-- 書き込みは service_role のみに限定（運営画面の server action からのみ）
create policy "Blog Images Service Role Upload"
  on storage.objects for insert
  with check (bucket_id = 'blog-images' and auth.role() = 'service_role');

create policy "Blog Images Service Role Update"
  on storage.objects for update
  using (bucket_id = 'blog-images' and auth.role() = 'service_role');

create policy "Blog Images Service Role Delete"
  on storage.objects for delete
  using (bucket_id = 'blog-images' and auth.role() = 'service_role');
