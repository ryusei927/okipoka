create table public.featured_items (
  id uuid not null default gen_random_uuid() primary key,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  
  image_url text not null,
  link_url text,
  alt_text text,
  
  is_active boolean not null default true
);

alter table public.featured_items enable row level security;

create policy "Public featured items are viewable by everyone." on public.featured_items for select using (true);
create policy "Admins can manage featured items" on public.featured_items for all using (auth.role() = 'authenticated');
