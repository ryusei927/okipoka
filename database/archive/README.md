# archive

廃止・旧版・スカッシュ前の SQL。**実行しないこと。**

## pre-squash-2026-07-13/

2026-07-13 にスキーマを `schema/01_tables.sql` 等へ畳む前のファイル一式。

| サブフォルダ | 内容 |
|--------------|------|
| `schema/` | 旧 `database/schema/` 断片 |
| `migrations/` | 旧 `database/migrations/`（`create_premium_codes.sql` 以外） |
| `old-archive/` | それ以前に `archive/` にあった旧ガチャ関数など |

現行の正はリポジトリ直下の `database/CURRENT.md` / `schema/` / `functions/` / `migrations/`。
