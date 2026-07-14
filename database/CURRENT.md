# CURRENT — Supabase の正の状態

AI・人間とも、DB に関する作業の前にこのファイルと `schema/` / `functions/` を読むこと。
`archive/` は履歴であり、実行も正ともみなさない。

最終スカッシュ日: **2026-07-13**（それ以前の断片 SQL は `archive/pre-squash-2026-07-13/`）

## 適用順（新規環境）

1. `schema/01_tables.sql`
2. `schema/02_policies.sql`
3. `schema/03_storage.sql`
4. `functions/*.sql`（すべて）
5. `migrations/` にある未適用差分（現状は `create_premium_codes.sql`）
6. 任意: `schema/seed.sql`（開発用ダミー）

本番への変更は **差分を `migrations/` に1ファイル追加**し、適用後にこの `CURRENT.md` と必要なら `schema/` も更新する。

## Types

| Type | Values |
|------|--------|
| `shop_plan` | `free` \| `business` \| `premium` |
| `ad_type` | `banner` \| `square` \| `story` \| `card` |

## Tables

| Table | Role | Notes |
|-------|------|--------|
| `shops` | 店舗マスタ | `owner_id` は将来の店舗ログイン用。`is_vacant` は **アプリ未使用** |
| `tournaments` | 大会・リング予定 | `type` / `is_template` / addon 系あり |
| `profiles` | 会員プロフィール・課金状態 | Square / cash。`vip_since` / `vip_expires_at` は **アプリ未使用**（`is_vip` は使用） |
| `gacha_items` | ガチャ景品 | `shop_id`, `limit_per_user`, `is_monthly_limit` |
| `user_items` | 当選アイテム | 直接 UPDATE 不可 → `use_coupon` |
| `gacha_logs` | 抽選ログ | |
| `featured_items` | トップ PR | |
| `ad_subscriptions` | 広告サブスク申込 | Square 連携 |
| `ads` | 広告枠 | `ad_subscription_id` 任意 |
| `ad_metrics` | 広告の日別集計（JST） | |
| `hands` / `hand_comments` / `hand_likes` | ハンド共有 | |
| `photo_albums` / `photo_album_photos` | プレイヤー写真 | |
| `chat_logs` | AI チャットログ | |
| `subscription_campaign_entries` | Instagram キャンペーン応募 | |
| `tournament_favorites` | （予約）お気に入り | **アプリ未使用** |
| `push_subscriptions` | （予約）Web Push | **アプリ未使用** |

### 未適用の差分（`migrations/`）

| Migration | Adds |
|-----------|------|
| `create_premium_codes.sql` | `premium_codes`, `premium_code_attempts`, `redeem_premium_code()` |

本番に適用したらこの節を「Tables / Functions」へ移し、migration は archive か「適用済み」メモにする。

## Schema 内関数・トリガ（`01_tables.sql`）

- `protect_profile_columns` + `trg_protect_profile_columns` — 課金/VIP 列のクライアント改ざん防止
- `use_coupon(uuid)` — クーポン使用
- `set_subscription_campaign_entries_updated_at` + trigger

## RPC（`functions/` が正）

| File | Function |
|------|----------|
| `spin_gacha.sql` | `spin_gacha()` |
| `create_get_public_gacha_items.sql` | 公開ガチャ一覧 |
| `fix_get_admin_gacha_items_jst.sql` | 管理画面ガチャ在庫（JST） |
| `fix_cash_subscription_expiry.sql` | `expire_cash_subscriptions()` |
| `create_ad_tracking_functions.sql` | `track_ad_impression` / `track_ad_click` |

## Storage buckets

- `shop-images` — 公開読取・書込（現行ポリシーは緩和済み）
- `avatars` — 公開読取、認証ユーザー書込
- `ads` — 公開読取、認証ユーザー書込
- `player-photos` — 公開読取、認証ユーザー書込（50MB・画像 MIME）

## アプリ未使用（DROP しない）

本番互換のためスキーマに残す。削除は別判断。

- 列: `shops.is_vacant`, `profiles.vip_since`, `profiles.vip_expires_at`
- 表: `tournament_favorites`, `push_subscriptions`
