-- 店舗テーブルのポリシー（開発用：誰でも操作可能）
drop policy if exists "Enable insert for everyone" on public.shops;
drop policy if exists "Enable update for everyone" on public.shops;
drop policy if exists "Enable delete for everyone" on public.shops;

create policy "Enable insert for everyone" on public.shops for insert with check (true);
create policy "Enable update for everyone" on public.shops for update using (true);
create policy "Enable delete for everyone" on public.shops for delete using (true);

-- トーナメントテーブルのポリシー（開発用：誰でも操作可能）
drop policy if exists "Enable insert for everyone" on public.tournaments;
drop policy if exists "Enable update for everyone" on public.tournaments;
drop policy if exists "Enable delete for everyone" on public.tournaments;

create policy "Enable insert for everyone" on public.tournaments for insert with check (true);
create policy "Enable update for everyone" on public.tournaments for update using (true);
create policy "Enable delete for everyone" on public.tournaments for delete using (true);
