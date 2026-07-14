-- 広告トラッキング RPC（正本）
-- アプリは track_ad_impression / track_ad_click を呼ぶ。
-- 日別集計（ad_metrics, JST）と ads 累計カラムの両方を更新する。

create or replace function public.track_ad_impression(p_ad_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  jst_day date := (now() at time zone 'Asia/Tokyo')::date;
begin
  insert into public.ad_metrics (ad_id, day, impressions)
  values (p_ad_id, jst_day, 1)
  on conflict (ad_id, day)
  do update set impressions = public.ad_metrics.impressions + 1;

  update public.ads
     set impression_count = coalesce(impression_count, 0) + 1
   where id = p_ad_id;
end;
$$;

create or replace function public.track_ad_click(p_ad_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  jst_day date := (now() at time zone 'Asia/Tokyo')::date;
begin
  insert into public.ad_metrics (ad_id, day, clicks)
  values (p_ad_id, jst_day, 1)
  on conflict (ad_id, day)
  do update set clicks = public.ad_metrics.clicks + 1;

  update public.ads
     set click_count = coalesce(click_count, 0) + 1
   where id = p_ad_id;
end;
$$;
