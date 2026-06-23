-- アドオン情報の詳細化
ALTER TABLE public.tournaments
ADD COLUMN IF NOT EXISTS addon_status text DEFAULT 'unknown', -- 'available', 'unavailable', 'unknown'
ADD COLUMN IF NOT EXISTS addon_stack text;
