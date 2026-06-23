export const SUBSCRIPTION_CAMPAIGN = {
  key: "instagram-subscription-2026-06",
  title: "サブスク登録キャンペーン",
  startAt: "2026-06-24T00:00:00+09:00",
  endAt: "2026-07-09T18:00:00+09:00",
  instagramAccount: "okipoka",
  storyHoldHours: 12,
  prizes: [
    {
      name: "ポケカ最新弾「アビスアイ」",
      unit: "1 BOX",
      tag: "最新弾",
      winners: 1,
    },
    {
      name: "Amazonギフト券",
      unit: "10,000円分",
      winners: 1,
    },
  ],
} as const;

// TODO(Instagramサブスクキャンペーン終了後): この一時機能の導線・画面・DBテーブルを削除する。
export function isSubscriptionCampaignActive(now = new Date()) {
  const startsAt = new Date(SUBSCRIPTION_CAMPAIGN.startAt);
  const endsAt = new Date(SUBSCRIPTION_CAMPAIGN.endAt);
  return startsAt <= now && now <= endsAt;
}

export function formatCampaignDateTime(value: string) {
  return new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function normalizeInstagramUsername(value: FormDataEntryValue | string | null) {
  if (typeof value !== "string") return "";

  return value
    .trim()
    .replace(/\s+/g, "")
    .replace(/^https?:\/\/(www\.)?instagram\.com\//i, "")
    .split("?")[0]
    .split("/")[0]
    .replace(/^[@＠]+/, "")
    .trim();
}

export function isValidInstagramUsername(value: string) {
  return /^[A-Za-z0-9._]{1,30}$/.test(value);
}

export function isActiveSubscriptionProfile(profile?: {
  subscription_status?: string | null;
  payment_method?: string | null;
  subscription_expires_at?: string | null;
} | null) {
  const hasActiveStatus =
    profile?.subscription_status === "active" || profile?.subscription_status === "canceling";

  const todayJst = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Tokyo" });
  const expiresStr =
    typeof profile?.subscription_expires_at === "string"
      ? profile.subscription_expires_at.slice(0, 10)
      : null;
  const isCashExpired =
    profile?.payment_method === "cash" && !!expiresStr && expiresStr < todayJst;

  return hasActiveStatus && !isCashExpired;
}

export function generateDrawNumber() {
  const random = Math.floor(100000 + Math.random() * 900000);
  return `OKP-202606-${random}`;
}
