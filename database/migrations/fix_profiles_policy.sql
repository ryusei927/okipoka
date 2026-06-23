-- profilesテーブルのRLSポリシー設定

-- 既存のポリシーがあれば削除（念のため）
drop policy if exists "Public profiles are viewable by everyone." on public.profiles;
drop policy if exists "Users can view own profile." on public.profiles;
drop policy if exists "Admin can view all profiles." on public.profiles;
drop policy if exists "Users can update own profile." on public.profiles;
drop policy if exists "Users can insert own profile." on public.profiles;

-- 自分のプロフィールのみ閲覧可能
create policy "Users can view own profile."
  on public.profiles for select
  using ( auth.uid() = id );

-- 管理者は全プロフィール閲覧可能
create policy "Admin can view all profiles."
  on public.profiles for select
  using ( (auth.jwt() ->> 'email') = 'okipoka.jp@gmail.com' );

-- 自分のプロフィールのみ更新可能
create policy "Users can update own profile."
  on public.profiles for update
  using ( auth.uid() = id );

-- 自分のプロフィールのみ作成可能
create policy "Users can insert own profile."
  on public.profiles for insert
  with check ( auth.uid() = id );
