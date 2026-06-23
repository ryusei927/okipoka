import { DailyGachaButton } from "@/components/member/DailyGachaButton";
import { LogoutButton } from "@/components/member/LogoutButton";
import { PaymentMethodRow } from "@/components/member/PaymentMethodRow";
import { createClient } from "@/lib/supabase/server";
import {
  SUBSCRIPTION_CAMPAIGN,
  isSubscriptionCampaignActive,
} from "@/lib/subscription-campaign";
import { redirect } from "next/navigation";
import { ChevronRight } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

function formatSubscriptionStatus(status?: string | null) {
  switch (status) {
    case "active":
      return { label: "有効", className: "bg-green-50 text-green-600 ring-green-100" };
    case "canceling":
      return { label: "解約予定", className: "bg-amber-50 text-amber-700 ring-amber-100" };
    case "past_due":
      return { label: "支払いエラー", className: "bg-red-50 text-red-600 ring-red-100" };
    case "canceled":
      return { label: "解約済み", className: "bg-gray-100 text-gray-600 ring-gray-200" };
    default:
      return { label: "未登録", className: "bg-gray-100 text-gray-500 ring-gray-200" };
  }
}

export default async function MemberPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const displayName = profile?.display_name || user.email?.split("@")[0] || "Guest";
  const isVip = profile?.is_vip || false;

  // 現金会員は subscription_expires_at を過ぎたら無効扱いにする（自動でcanceledに落ちないため）
  const todayJst = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Tokyo" }); // YYYY-MM-DD
  const expiresStr =
    typeof profile?.subscription_expires_at === "string"
      ? profile.subscription_expires_at.slice(0, 10)
      : null;
  const isCashExpired =
    profile?.payment_method === "cash" && !!expiresStr && expiresStr < todayJst;

  const hasActiveStatus =
    profile?.subscription_status === "active" || profile?.subscription_status === "canceling";
  const isPremiumMember = hasActiveStatus && !isCashExpired;
  const avatarUrl = profile?.avatar_url;
  const adminEmail = (process.env.OKIPOKA_ADMIN_EMAIL ?? "okipoka.jp@gmail.com").toLowerCase();
  const isAdmin = (user.email ?? "").toLowerCase() === adminEmail;
  const isSubscriber = isPremiumMember;
  const subscriptionStatus = isCashExpired
    ? { label: "期限切れ", className: "bg-gray-100 text-gray-600 ring-gray-200" }
    : formatSubscriptionStatus(profile?.subscription_status);
  const campaignActive = isSubscriptionCampaignActive();

  const { data: campaignEntry } =
    isSubscriber
      ? await supabase
          .from("subscription_campaign_entries")
          .select("draw_number,status")
          .eq("campaign_key", SUBSCRIPTION_CAMPAIGN.key)
          .eq("user_id", user.id)
          .maybeSingle()
      : { data: null };

  return (
    <div className="min-h-screen bg-[#f6f6f7] pb-10">
      <main className="mx-auto max-w-5xl px-4 pt-5 md:px-6 lg:pt-6">
        <div className="overflow-hidden rounded-sm bg-white ring-1 ring-gray-200/80 shadow-[0_18px_60px_rgba(15,23,42,0.06)] lg:grid lg:grid-cols-[320px_minmax(0,1fr)]">
          <aside className="border-b border-gray-100 bg-linear-to-b from-white to-gray-50/70 p-5 lg:border-b-0 lg:border-r lg:p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-14 h-14 rounded-sm overflow-hidden shrink-0 bg-gray-100 ring-1 ring-gray-200">
                  {avatarUrl ? (
                    <Image src={avatarUrl} alt={displayName} width={56} height={56} className="w-full h-full object-cover" unoptimized />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-xl font-semibold">
                      {displayName.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-gray-400">マイページ</p>
                  <h1 className="mt-1 text-2xl font-bold text-gray-950 tracking-tight truncate">{displayName}</h1>
                </div>
              </div>
              <Link
                href="/member/profile"
                className="shrink-0 text-sm font-medium text-gray-500 hover:text-gray-900 px-3 py-1.5 rounded-sm bg-white ring-1 ring-gray-200 hover:ring-gray-300 transition-all"
              >
                編集
              </Link>
            </div>

            <div className="mt-6 space-y-3">
              <div className="flex items-center justify-between gap-4 border-b border-gray-100 pb-3">
                <span className="text-sm text-gray-500">会員ステータス</span>
                <div className="flex flex-wrap justify-end gap-1.5">
                  {isPremiumMember && (
                    <span className="inline-flex text-[11px] font-bold text-amber-700 bg-amber-50 ring-1 ring-amber-100 px-2.5 py-0.5 rounded-sm">
                      PREMIUM
                    </span>
                  )}
                  {isVip && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-orange-600 bg-orange-50 ring-1 ring-orange-100 px-2.5 py-0.5 rounded-sm">
                      VIP
                    </span>
                  )}
                  {!isPremiumMember && !isVip && (
                    <span className="text-[11px] font-medium text-gray-500 bg-white ring-1 ring-gray-200 px-2.5 py-0.5 rounded-sm">メンバー</span>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between gap-4 border-b border-gray-100 pb-3">
                <span className="text-sm text-gray-500">プレミアム</span>
                <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-sm ring-1 ${subscriptionStatus.className}`}>
                  {subscriptionStatus.label}
                </span>
              </div>
              {isPremiumMember && profile?.payment_method !== "cash" && (
                <PaymentMethodRow />
              )}
              <div className="flex items-center justify-between gap-4">
                <span className="text-sm text-gray-500">メール</span>
                <span className="text-sm font-medium text-gray-800 truncate text-right">{user.email}</span>
              </div>
            </div>

            <div className="mt-6 hidden lg:block">
              <LogoutButton />
            </div>
          </aside>

          <div className="p-4 md:p-5 lg:p-6">
            <section>
              <SectionTitle>アクション</SectionTitle>
              <div className="overflow-hidden rounded-sm bg-white ring-1 ring-gray-200/70 divide-y divide-gray-100">
                {!isSubscriber ? (
                  <MenuLink href="/member/subscription" label="プレミアム会員登録" sub="月額2,200円で毎日ガチャが引ける" />
                ) : (
                  <>
                    <DailyGachaButton lastGachaAt={profile?.last_gacha_at} isAdmin={isAdmin} />
                    {(campaignActive || campaignEntry) && (
                      <CampaignMenuLink
                        href="/member/subscription-campaign"
                        entered={Boolean(campaignEntry)}
                        drawNumber={campaignEntry?.draw_number ?? null}
                      />
                    )}
                    <MenuLink href="/member/subscription" label="プレミアム管理" sub="登録状況の確認・解約" />
                  </>
                )}
                <MenuLink href="/member/items" label="獲得アイテム" sub="チケット・クーポン" />
              </div>
            </section>

            <section className="mt-5">
              <SectionTitle>メニュー</SectionTitle>
              <div className="grid gap-3 md:grid-cols-2">
                <MenuTile href="/member/profile" label="プロフィール編集" sub="表示名やアイコンの変更" />
                <MenuTile href="/member/settings" label="設定" sub="パスワードの変更" />
                {isAdmin && (
                  <MenuTile href="/dashboard" label="管理者ダッシュボード" sub="サイト管理・設定" />
                )}
              </div>
            </section>
          </div>

          <div className="border-t border-gray-100 p-4 md:p-5 lg:hidden">
            <LogoutButton />
          </div>
        </div>
      </main>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-2 px-1 text-xs font-semibold text-gray-400 tracking-wide">
      {children}
    </h2>
  );
}

function MenuTile({
  href,
  label,
  sub,
}: {
  href: string;
  label: string;
  sub: string;
}) {
  return (
    <Link href={href} className="group flex items-center gap-4 rounded-sm bg-white p-4 ring-1 ring-gray-200/70 hover:ring-gray-300 hover:shadow-sm transition-all">
      <div className="flex-1 min-w-0">
        <p className="text-[15px] font-medium text-gray-900">{label}</p>
        <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
      </div>
      <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 shrink-0" />
    </Link>
  );
}

function MenuLink({
  href,
  label,
  sub,
}: {
  href: string;
  label: string;
  sub: string;
}) {
  return (
    <Link href={href} className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors group">
      <div className="flex-1 min-w-0">
        <p className="text-[15px] font-medium text-gray-900">{label}</p>
        <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
      </div>
      <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-400" />
    </Link>
  );
}

function CampaignMenuLink({
  href,
  entered,
  drawNumber,
}: {
  href: string;
  entered: boolean;
  drawNumber: string | null;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-4 bg-orange-50/70 px-5 py-4 ring-1 ring-inset ring-orange-100 transition-colors hover:bg-orange-50"
    >
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-[15px] font-bold text-gray-950">キャンペーン応募</p>
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-black ${
              entered
                ? "bg-green-50 text-green-700 ring-1 ring-green-100"
                : "bg-orange-500 text-white"
            }`}
          >
            {entered ? "参加済み" : "未参加"}
          </span>
        </div>
        <p className="mt-0.5 text-xs text-orange-700/80">
          {entered && drawNumber
            ? `抽選番号: ${drawNumber}`
            : "Instagram投稿で抽選に参加"}
        </p>
      </div>
      <ChevronRight className="w-4 h-4 text-orange-300 group-hover:text-orange-500" />
    </Link>
  );
}
