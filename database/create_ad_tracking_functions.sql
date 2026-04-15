-- クリック数をアトミックにインクリメントする関数
create or replace function increment_ad_click(ad_id uuid)
returns void as $$
begin
  update ads set click_count = coalesce(click_count, 0) + 1 where id = ad_id;
end;
$$ language plpgsql security definer;

-- インプレッション数をアトミックにインクリメントする関数
create or replace function increment_ad_impression(ad_id uuid)
returns void as $$
begin
  update ads set impression_count = coalesce(impression_count, 0) + 1 where id = ad_id;
end;
$$ language plpgsql security definer;
