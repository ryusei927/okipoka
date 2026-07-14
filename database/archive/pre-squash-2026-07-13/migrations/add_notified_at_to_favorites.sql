-- 通知済み日時を記録するカラムを追加
alter table tournament_favorites add column if not exists notified_at timestamp with time zone;
