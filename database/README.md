# database

Supabase（PostgreSQL）向け SQL。アプリからは実行されず、**Supabase SQL Editor で手動適用**する。

## まず読むもの

1. **[CURRENT.md](./CURRENT.md)** — 現行テーブル / RPC / 未使用物の一覧（**正の説明**）
2. **`schema/`** — 現行スキーマ定義
3. **`functions/`** — 現行 RPC（**関数の正**）

`archive/` は履歴。**実行しない・正とみなさない。**

## フォルダ構成

| パス | 役割 |
|------|------|
| `CURRENT.md` | 現状の地図（AI・人間の入口） |
| `schema/01_tables.sql` | 型・テーブル・インデックス・スキーマ内トリガ |
| `schema/02_policies.sql` | RLS |
| `schema/03_storage.sql` | Storage buckets / policies |
| `schema/seed.sql` | 開発用ダミー（任意） |
| `functions/` | 現行 RPC |
| `migrations/` | **スカッシュ以降**の差分のみ |
| `archive/pre-squash-2026-07-13/` | 2026-07-13 以前の断片 SQL |

## 変更の入れ方

1. 差分 SQL を `migrations/YYYYMMDD_description.sql`（または意味の分かる名前）として追加する
2. Supabase に適用する
3. **`CURRENT.md` を更新**する（必要なら `schema/` にもマージする）
4. RPC を変えたら `functions/` の該当ファイルを更新する（旧版は `archive/` へ）

新規環境をゼロから作る場合: `schema` → `functions` → `migrations` の順。

## 重要な関数

- **`spin_gacha.sql`** — ガチャ抽選の決定版
- **`create_ad_tracking_functions.sql`** — `track_ad_impression` / `track_ad_click`
- **`fix_cash_subscription_expiry.sql`** — 現金会員の期限切れ処理
- その他は `CURRENT.md` の RPC 表を参照
