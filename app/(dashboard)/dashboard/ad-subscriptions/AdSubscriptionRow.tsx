"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  Mail,
  Phone,
  User,
  Building2,
  CreditCard,
  CalendarClock,
  Loader2,
  ExternalLink,
  Eye,
  EyeOff,
  Link2,
  ImagePlus,
} from "lucide-react";

export type LinkedAd = {
  id: string;
  title: string;
  image_url: string;
  link_url: string | null;
  type: string;
  is_active: boolean;
};

type Card = {
  brand: string;
  last4: string;
  expMonth: number | null;
  expYear: number | null;
};

type Billing = {
  status: string | null;
  chargedThroughDate: string | null;
  nextRenewalDate: string | null;
  card: Card | null;
} | null;

export type AdSub = {
  id: string;
  business_name: string;
  contact_name: string | null;
  email: string;
  phone: string | null;
  note: string | null;
  link_url: string | null;
  desired_ad_type: string | null;
  square_subscription_id: string | null;
  subscription_status: string | null;
  created_at: string;
};

function statusBadge(status: string | null) {
  switch (status) {
    case "active":
      return { label: "有効", className: "bg-green-50 text-green-700" };
    case "canceling":
      return { label: "解約予定", className: "bg-amber-50 text-amber-700" };
    case "past_due":
      return { label: "支払いエラー", className: "bg-red-50 text-red-600" };
    case "canceled":
      return { label: "解約済み", className: "bg-gray-100 text-gray-500" };
    default:
      return { label: "不明", className: "bg-gray-100 text-gray-500" };
  }
}

function formatBrand(brand: string): string {
  switch (brand.toUpperCase()) {
    case "VISA":
      return "Visa";
    case "MASTERCARD":
      return "Mastercard";
    case "AMERICAN_EXPRESS":
      return "Amex";
    case "JCB":
      return "JCB";
    case "DISCOVER":
      return "Discover";
    case "DISCOVER_DINERS":
      return "Diners";
    case "CHINA_UNIONPAY":
      return "UnionPay";
    default:
      return "カード";
  }
}

function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Tokyo",
  }).format(new Date(iso));
}

export function AdSubscriptionRow({
  sub,
  billing,
  ad,
}: {
  sub: AdSub;
  billing: Billing;
  ad: LinkedAd | null;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const status = billing?.status ?? sub.subscription_status;
  const badge = statusBadge(status);
  const isActive = status === "active";
  const isCanceling = status === "canceling";

  const exp =
    billing?.card?.expMonth != null && billing?.card?.expYear != null
      ? `${String(billing.card.expMonth).padStart(2, "0")}/${String(billing.card.expYear).slice(-2)}`
      : null;

  async function handleCancel() {
    if (!sub.square_subscription_id) return;
    if (
      !window.confirm(
        `「${sub.business_name}」の広告契約を解約しますか？\n（次回更新日までは掲載が継続されます）`
      )
    )
      return;

    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/ad-subscriptions/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscriptionId: sub.square_subscription_id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "解約に失敗しました");
      router.refresh();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleTogglePublish() {
    if (!ad) return;
    setPublishing(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/ad-subscriptions/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adId: ad.id, isActive: !ad.is_active }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "更新に失敗しました");
      router.refresh();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setPublishing(false);
    }
  }

  return (
    <div className="bg-white p-4 border border-gray-200">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="mb-1.5 flex items-center gap-2">
            <span className={`text-xs px-2 py-0.5 font-bold ${badge.className}`}>
              {badge.label}
            </span>
            <span className="text-xs text-gray-400">
              {formatDateTime(sub.created_at)} 申込
            </span>
          </div>
          <h3 className="flex items-center gap-1.5 font-bold text-gray-900">
            <Building2 className="h-4 w-4 shrink-0 text-gray-400" />
            {sub.business_name}
          </h3>

          <div className="mt-2 flex flex-col gap-1 text-sm text-gray-600 sm:flex-row sm:flex-wrap sm:gap-x-5 sm:gap-y-1">
            {sub.contact_name && (
              <span className="inline-flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-gray-400" />
                {sub.contact_name}
              </span>
            )}
            <a
              href={`mailto:${sub.email}`}
              className="inline-flex items-center gap-1.5 hover:text-orange-500"
            >
              <Mail className="h-3.5 w-3.5 text-gray-400" />
              {sub.email}
            </a>
            {sub.phone && (
              <a
                href={`tel:${sub.phone}`}
                className="inline-flex items-center gap-1.5 hover:text-orange-500"
              >
                <Phone className="h-3.5 w-3.5 text-gray-400" />
                {sub.phone}
              </a>
            )}
          </div>

          {/* 課金情報 */}
          <div className="mt-3 flex flex-col gap-1.5 border-t border-gray-100 pt-3 text-sm text-gray-600 sm:flex-row sm:flex-wrap sm:gap-x-5">
            {billing?.nextRenewalDate ? (
              <span className="inline-flex items-center gap-1.5">
                <CalendarClock className="h-3.5 w-3.5 text-gray-400" />
                {isCanceling ? "掲載終了日" : "次回引き落とし日"}：
                <span className="font-semibold text-gray-900">
                  {billing.nextRenewalDate}
                </span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-gray-400">
                <CalendarClock className="h-3.5 w-3.5" />
                請求日：取得できませんでした
              </span>
            )}

            {billing?.card ? (
              <span className="inline-flex items-center gap-1.5">
                <CreditCard className="h-3.5 w-3.5 text-gray-400" />
                {formatBrand(billing.card.brand)}
                <span className="text-gray-400">•••• {billing.card.last4}</span>
                {exp && <span className="text-[11px] text-gray-400">({exp})</span>}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-gray-400">
                <CreditCard className="h-3.5 w-3.5" />
                カード情報なし
              </span>
            )}
          </div>

          {sub.note && (
            <p className="mt-2 whitespace-pre-wrap text-sm text-gray-500">{sub.note}</p>
          )}

          {/* 広告クリエイティブ */}
          {ad ? (
            <div className="mt-3 border-t border-gray-100 pt-3">
              <div className="flex items-start gap-3">
                <div className="relative h-16 w-28 shrink-0 overflow-hidden rounded-sm bg-gray-50 ring-1 ring-gray-200">
                  <Image
                    src={ad.image_url}
                    alt={ad.title}
                    fill
                    className="object-contain"
                    unoptimized
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 font-bold">
                      {ad.type === "banner" ? "バナー" : "スクエア"}
                    </span>
                    <span
                      className={`text-xs px-2 py-0.5 font-bold ${
                        ad.is_active
                          ? "bg-green-50 text-green-700"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {ad.is_active ? "公開中" : "非公開（下書き）"}
                    </span>
                  </div>
                  {ad.link_url && (
                    <a
                      href={ad.link_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 inline-flex min-w-0 max-w-full items-center gap-1 text-xs text-gray-500 hover:text-orange-500"
                    >
                      <Link2 className="h-3 w-3 shrink-0" />
                      <span className="truncate">{ad.link_url}</span>
                    </a>
                  )}
                  <button
                    onClick={handleTogglePublish}
                    disabled={publishing}
                    className={`mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                      ad.is_active
                        ? "bg-gray-50 text-gray-700 hover:bg-gray-100"
                        : "bg-orange-500 text-white hover:bg-orange-600"
                    }`}
                  >
                    {publishing ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : ad.is_active ? (
                      <EyeOff className="h-3.5 w-3.5" />
                    ) : (
                      <Eye className="h-3.5 w-3.5" />
                    )}
                    {ad.is_active ? "非公開にする" : "公開する"}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-3 border-t border-gray-100 pt-3">
              {/* 申込時のヒアリング内容 */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-600">
                {sub.desired_ad_type && (
                  <span className="inline-flex items-center gap-1.5">
                    希望タイプ：
                    <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 font-bold">
                      {sub.desired_ad_type === "square" ? "スクエア" : "バナー"}
                    </span>
                  </span>
                )}
                {sub.link_url && (
                  <a
                    href={sub.link_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-w-0 items-center gap-1 hover:text-orange-500"
                  >
                    <Link2 className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                    <span className="truncate">{sub.link_url}</span>
                  </a>
                )}
              </div>
              <p className="mt-2 text-xs text-amber-600">
                広告画像が未登録です。画像を用意して広告を作成・公開してください。
              </p>
              <Link
                href={`/dashboard/ads/new?sub=${sub.id}`}
                className="mt-2 inline-flex items-center gap-1.5 bg-orange-500 px-3 py-1.5 text-sm font-bold text-white transition-colors hover:bg-orange-600"
              >
                <ImagePlus className="h-3.5 w-3.5" />
                広告を作成して紐づける
              </Link>
            </div>
          )}

          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        </div>

        <div className="flex shrink-0 flex-col items-end gap-2">
          {sub.square_subscription_id && (
            <a
              href="https://squareup.com/dashboard/subscriptions/list"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs font-medium text-gray-400 hover:text-orange-500"
              title={`Square サブスクID: ${sub.square_subscription_id}`}
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Square
            </a>
          )}

          {(isActive || isCanceling) && sub.square_subscription_id && (
            <button
              onClick={handleCancel}
              disabled={loading || isCanceling}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-bold text-gray-700 bg-gray-50 hover:bg-gray-100 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {isCanceling ? "解約予定" : "解約する"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
