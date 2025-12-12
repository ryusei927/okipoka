-- Create enum for ad types
create type ad_type as enum ('banner', 'square');

-- Create ads table
create table ads (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  image_url text not null,
  link_url text,
  type ad_type not null default 'banner',
  is_active boolean default true,
  priority integer default 0,
  start_at timestamptz,
  end_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS
alter table ads enable row level security;

-- Create policies
create policy "Public ads are viewable by everyone"
  on ads for select
  using (true);

create policy "Admins can manage ads"
  on ads for all
  using (auth.role() = 'authenticated');

-- Create storage bucket for ad images if it doesn't exist
insert into storage.buckets (id, name, public)
values ('ads', 'ads', true)
on conflict (id) do nothing;

create policy "Ad images are publicly accessible"
  on storage.objects for select
  using ( bucket_id = 'ads' );

create policy "Admins can upload ad images"
  on storage.objects for insert
  with check ( bucket_id = 'ads' and auth.role() = 'authenticated' );

create policy "Admins can update ad images"
  on storage.objects for update
  using ( bucket_id = 'ads' and auth.role() = 'authenticated' );

create policy "Admins can delete ad images"
  on storage.objects for delete
  using ( bucket_id = 'ads' and auth.role() = 'authenticated' );
