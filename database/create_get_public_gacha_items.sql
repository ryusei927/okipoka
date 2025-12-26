CREATE OR REPLACE FUNCTION public.get_public_gacha_items()
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
  is_active BOOLEAN,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  shop_id UUID,
  is_monthly_limit BOOLEAN,
  current_stock_used BIGINT,
  shop_image_url TEXT
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
    gi.is_active,
    gi.deleted_at,
    gi.created_at,
    gi.shop_id,
    gi.is_monthly_limit,
    CASE
      WHEN gi.is_monthly_limit THEN (
        SELECT COUNT(*)
        FROM gacha_logs gl
        WHERE gl.item_id = gi.id
          AND gl.created_at >= (date_trunc('month', (now() AT TIME ZONE 'Asia/Tokyo')) AT TIME ZONE 'Asia/Tokyo')
      )
      ELSE gi.stock_used::BIGINT
    END as current_stock_used,
    s.image_url as shop_image_url
  FROM gacha_items gi
  LEFT JOIN shops s ON s.id = gi.shop_id
  WHERE gi.is_active = true
    AND gi.deleted_at IS NULL
  ORDER BY gi.probability DESC, gi.created_at DESC;
END;
$$;
