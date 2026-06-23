# database

Supabase（PostgreSQL）に手動で適用してきた SQL スクリプト集。
アプリのコードからは参照されず、Supabase の SQL Editor で実行する運用。

## フォルダ構成

| フォルダ | 役割 |
|----------|------|
| `schema/` | テーブル・ストレージ・seed など土台の定義 |
| `functions/` | 現役の RPC / 関数定義（**これが最新・正**） |
| `migrations/` | 列追加・ポリシー・インデックスなどの差分変更 |
| `archive/` | 旧版・廃止済み。**実行しないこと**（履歴として保管） |

## 重要な関数（functions/）

- **`spin_gacha.sql`** … ガチャ抽選の**決定版**。本番で稼働中のロジック＋1日1回制限の競合対策（`FOR UPDATE`）入り。
  - 過去の `update_spin_gacha_*.sql` / `fix_spin_gacha_limit_check.sql` は `archive/` に隔離済み。今後はこのファイルのみを基準とする。
- `fix_get_admin_gacha_items_jst.sql` … 管理画面のガチャ在庫表示用関数（JST月初基準の最新版）。
- `fix_cash_subscription_expiry.sql` … 現金会員の期限切れを自動失効させる関数 `expire_cash_subscriptions()`。
- `create_get_public_gacha_items.sql` … 公開側のガチャ一覧取得。
- `create_ad_tracking_functions.sql` … 広告のクリック/インプレッション集計。

## 注意
- これらは「自動マイグレーション」ではなく手動適用スクリプト。新規に環境を作る場合は schema → functions → migrations の順におおよそ適用する想定。
- `archive/` のファイルは現状と矛盾する定義を含むため、絶対に実行しない。
