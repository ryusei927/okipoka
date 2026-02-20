-- プレイヤーズフォト機能用テーブル

-- フォトアルバムテーブル（イベント単位）
create table public.photo_albums (
  id uuid not null default gen_random_uuid() primary key,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  
  title text not null,                    -- "第5回沖縄ポーカーフェスティバル" など
  description text,                       -- アルバムの説明文
  cover_image_url text,                   -- カバー画像URL
  event_date date not null,               -- イベント開催日
  is_published boolean not null default false, -- 公開フラグ
  
  photo_count integer not null default 0  -- 写真枚数キャッシュ
);

-- フォト（アルバム内の個別写真）
create table public.photo_album_photos (
  id uuid not null default gen_random_uuid() primary key,
  created_at timestamptz not null default now(),
  
  album_id uuid not null references public.photo_albums(id) on delete cascade,
  image_url text not null,                -- 画像URL（Supabase Storage）
  thumbnail_url text,                     -- サムネイル用URL（任意）
  caption text,                           -- キャプション
  sort_order integer not null default 0   -- 表示順
);

-- インデックス
create index idx_photo_albums_event_date on public.photo_albums(event_date desc);
create index idx_photo_albums_published on public.photo_albums(is_published);
create index idx_photo_album_photos_album_id on public.photo_album_photos(album_id);
create index idx_photo_album_photos_sort_order on public.photo_album_photos(album_id, sort_order);

-- RLS
alter table public.photo_albums enable row level security;
alter table public.photo_album_photos enable row level security;

-- 公開されたアルバムは誰でも閲覧可能
create policy "Published albums are viewable by everyone"
  on public.photo_albums for select
  using (is_published = true);

-- 公開されたアルバムの写真は誰でも閲覧可能
create policy "Published album photos are viewable by everyone"
  on public.photo_album_photos for select
  using (
    exists (
      select 1 from public.photo_albums
      where id = photo_album_photos.album_id
      and is_published = true
    )
  );

-- Storageバケット
insert into storage.buckets (id, name, public)
values ('player-photos', 'player-photos', true)
on conflict (id) do nothing;

-- Storage ポリシー
create policy "Public Access for player-photos"
  on storage.objects for select
  using ( bucket_id = 'player-photos' );

create policy "Authenticated Upload for player-photos"
  on storage.objects for insert
  with check ( bucket_id = 'player-photos' and auth.role() = 'authenticated' );

create policy "Authenticated Update for player-photos"
  on storage.objects for update
  using ( bucket_id = 'player-photos' and auth.role() = 'authenticated' );

create policy "Authenticated Delete for player-photos"
  on storage.objects for delete
  using ( bucket_id = 'player-photos' and auth.role() = 'authenticated' );
