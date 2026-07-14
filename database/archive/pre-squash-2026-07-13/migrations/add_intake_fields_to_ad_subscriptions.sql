-- 申込時のヒアリング情報を保存するカラム。
-- 画像は運営が後から管理画面で登録するため、ここでは希望タイプとリンク先のみ受け取る。
-- （要望メモは既存の note カラムを使用）

alter table ad_subscriptions
  add column if not exists desired_ad_type text,
  add column if not exists link_url text;
