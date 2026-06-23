# archive — 旧版・廃止済み（実行しないこと）

ここにあるファイルは過去のバージョンで、現在の定義と矛盾する内容を含みます。
履歴として残しているだけなので、**Supabase で実行しないでください。**

## spin_gacha の旧版（→ 現役は `../functions/spin_gacha.sql`）
- `update_spin_gacha_with_limit.sql`
- `update_spin_gacha_return_shop_id.sql`
- `update_spin_gacha_monthly.sql`
- `update_spin_gacha_admin_no_stock.sql`
- `update_spin_gacha_cash_expiry.sql`（`expires_in_days` 等、現行と非互換）
- `fix_spin_gacha_limit_check.sql`

## get_admin_gacha_items の旧版（→ 現役は `../functions/fix_get_admin_gacha_items_jst.sql`）
- `create_get_admin_gacha_items.sql`
- `fix_get_admin_gacha_items.sql`
