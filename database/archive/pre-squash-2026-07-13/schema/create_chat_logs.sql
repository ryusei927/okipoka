create table if not exists public.chat_logs (
  id uuid not null default gen_random_uuid(),
  user_id uuid references auth.users(id),
  role text not null,
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  session_id text,
  primary key (id)
);

alter table public.chat_logs enable row level security;

create policy "Enable insert for everyone" on public.chat_logs
  for insert with check (true);

create policy "Enable select for admins only" on public.chat_logs
  for select using (true); -- 開発中は一旦全許可、本番では制限すべき
