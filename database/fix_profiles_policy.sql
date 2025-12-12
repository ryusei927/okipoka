-- profilesテーブルのRLSポリシー設定

-- 既存のポリシーがあれば削除（念のため）
drop policy if exists "Public profiles are viewable by everyone." on public.profiles;
drop policy if exists "Users can update own profile." on public.profiles;
drop policy if exists "Users can insert own profile." on public.profiles;

-- 誰でもプロフィールは閲覧可能
create policy "Public profiles are viewable by everyone."
  on public.profiles for select
  using ( true );

-- 自分のプロフィールのみ更新可能
create policy "Users can update own profile."
  on public.profiles for update
  using ( auth.uid() = id );

-- 自分のプロフィールのみ作成可能
create policy "Users can insert own profile."
  on public.profiles for insert
  with check ( auth.uid() = id );
