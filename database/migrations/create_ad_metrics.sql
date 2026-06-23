-- 広告の表示回数・クリック数を「日別」で集計するテーブル。
-- これにより「今月◯回表示」「先月との比較」「推移」などを出せるようになる。
-- 日付は日本時間（Asia/Tokyo）基準で記録する。

create table if not exists ad_metrics (
  ad_id uuid not null references ads(id) on delete cascade,
  day date not null,
  impressions integer not null default 0,
  clicks integer not null default 0,
  primary key (ad_id, day)
);

create index if not exists ad_metrics_day_idx on ad_metrics (day);

alter table ad_metrics enable row level security;

-- 管理者（ログイン済み）のみ閲覧可能
drop policy if exists "Admins can view ad metrics" on ad_metrics;
create policy "Admins can view ad metrics"
  on ad_metrics for select
  using (auth.role() = 'authenticated');

-- 表示回数を記録（日別集計テーブル＋ ads の累計カラムの両方を更新）
create or replace function track_ad_impression(p_ad_id uuid)
returns void as $$
declare
  jst_day date := (now() at time zone 'Asia/Tokyo')::date;
begin
  insert into ad_metrics (ad_id, day, impressions)
  values (p_ad_id, jst_day, 1)
  on conflict (ad_id, day)
  do update set impressions = ad_metrics.impressions + 1;

  update ads set impression_count = coalesce(impression_count, 0) + 1 where id = p_ad_id;
end;
$$ language plpgsql security definer;

-- クリック数を記録（日別集計テーブル＋ ads の累計カラムの両方を更新）
create or replace function track_ad_click(p_ad_id uuid)
returns void as $$
declare
  jst_day date := (now() at time zone 'Asia/Tokyo')::date;
begin
  insert into ad_metrics (ad_id, day, clicks)
  values (p_ad_id, jst_day, 1)
  on conflict (ad_id, day)
  do update set clicks = ad_metrics.clicks + 1;

  update ads set click_count = coalesce(click_count, 0) + 1 where id = p_ad_id;
end;
$$ language plpgsql security definer;
