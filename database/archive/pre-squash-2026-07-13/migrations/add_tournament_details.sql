-- トーナメント詳細情報のカラム追加
ALTER TABLE public.tournaments
ADD COLUMN IF NOT EXISTS late_reg_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS reentry_fee text,
ADD COLUMN IF NOT EXISTS addon_fee text,
ADD COLUMN IF NOT EXISTS stack text,
ADD COLUMN IF NOT EXISTS prizes text,
ADD COLUMN IF NOT EXISTS notes text,
ADD COLUMN IF NOT EXISTS type text DEFAULT 'トーナメント';

-- 既存のデータに対してデフォルト値を設定する場合（必要であれば）
-- UPDATE public.tournaments SET type = 'トーナメント' WHERE type IS NULL;
