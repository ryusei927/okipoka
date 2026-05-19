-- 当選上限ありで「毎月リセット」がOFFの景品を月間制限に一括変更
-- （意図的に通算のみにしたい景品は、管理画面でチェックを外してください）

UPDATE public.gacha_items
SET is_monthly_limit = true
WHERE deleted_at IS NULL
  AND type <> 'none'
  AND stock_total IS NOT NULL
  AND is_monthly_limit = false;
