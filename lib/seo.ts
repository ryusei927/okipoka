import { getCanonicalSiteUrl } from "@/lib/site-url";

/**
 * SEO用の正規サイトURL。
 * OGP・sitemap・canonical で同一のドメインを使うため、site-url に一元化する。
 */
export const SITE_URL = getCanonicalSiteUrl();

export const SITE_NAME = "OKIPOKA";

export const SITE_DESCRIPTION =
  "沖縄のポーカー情報を全てここに。毎日のトーナメント情報や店舗の詳細情報をリアルタイムでお届けします。";
