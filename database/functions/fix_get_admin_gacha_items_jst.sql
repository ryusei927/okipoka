-- 管理画面の月間在庫カウントを抽選（spin_gacha）と同じ JST 月初に揃える
-- stock_used=0 ハックを削除（手動リセットと表示が食い違うため）

CREATE OR REPLACE FUNCTION public.get_admin_gacha_items()
RETURNS TABLE (
  id UUID,
  name TEXT,
  description TEXT,
  image_url TEXT,
  probability INTEGER,
  type TEXT,
  value INTEGER,
  cost_yen INTEGER,
  expires_days INTEGER,
  stock_total INTEGER,
  stock_used INTEGER,
  limit_per_user INTEGER,
  is_active BOOLEAN,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  shop_id UUID,
  is_monthly_limit BOOLEAN,
  current_stock_used BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    gi.id,
    gi.name,
    gi.description,
    gi.image_url,
    gi.probability,
    gi.type,
    gi.value,
    gi.cost_yen,
    gi.expires_days,
    gi.stock_total,
    gi.stock_used,
    gi.limit_per_user,
    gi.is_active,
    gi.deleted_at,
    gi.created_at,
    gi.shop_id,
    gi.is_monthly_limit,
    CASE
      WHEN gi.is_monthly_limit THEN (
        SELECT COUNT(*)::BIGINT
        FROM gacha_logs gl
        WHERE gl.item_id = gi.id
          AND gl.created_at >= (date_trunc('month', (now() AT TIME ZONE 'Asia/Tokyo')) AT TIME ZONE 'Asia/Tokyo')
      )
      ELSE gi.stock_used::BIGINT
    END as current_stock_used
  FROM gacha_items gi
  WHERE gi.deleted_at IS NULL
  ORDER BY gi.created_at DESC;
END;
$$;
