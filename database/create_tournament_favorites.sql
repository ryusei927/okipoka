-- トーナメントお気に入り機能用のテーブル
create table if not exists tournament_favorites (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  tournament_id uuid references public.tournaments(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, tournament_id)
);

-- RLS設定
alter table tournament_favorites enable row level security;

create policy "Users can view their own favorites"
  on tournament_favorites for select
  using (auth.uid() = user_id);

create policy "Users can insert their own favorites"
  on tournament_favorites for insert
  with check (auth.uid() = user_id);

create policy "Users can delete their own favorites"
  on tournament_favorites for delete
  using (auth.uid() = user_id);
