-- 既存のハズレアイテムを無効化（論理削除）
UPDATE public.gacha_items
SET is_active = false, deleted_at = NOW()
WHERE type = 'none';
