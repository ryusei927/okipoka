-- 広告フォーマットの拡張: story（横スクロール）、card（インフィード）を追加
-- description カラム追加（キャッチコピー用）
-- click_count / impression_count カラム追加（計測用）

-- 既存の enum に新しい値を追加
alter type ad_type add value if not exists 'story';
alter type ad_type add value if not exists 'card';

-- description カラム追加
alter table ads add column if not exists description text;

-- 計測カラム追加
alter table ads add column if not exists click_count integer default 0;
alter table ads add column if not exists impression_count integer default 0;
