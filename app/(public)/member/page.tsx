import { DigitalMemberCard } from "@/components/member/DigitalMemberCard";
import { DailyGachaButton } from "@/components/member/DailyGachaButton";
import { LogoutButton } from "@/components/member/LogoutButton";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { User, Settings, LayoutDashboard, Crown, Ticket, ChevronRight, Gift } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

function formatSubscriptionStatus(status?: string | null) {
  switch (status) {
    case "active":
      return { label: "有効", className: "bg-green-100 text-green-700" };
    case "canceling":
      return { label: "解約予定", className: "bg-yellow-100 text-yellow-800" };
    case "past_due":
      return { label: "支払いエラー", className: "bg-red-100 text-red-700" };
    case "canceled":
      return { label: "解約済み", className: "bg-gray-200 text-gray-700" };
    default:
      return { label: "未登録", className: "bg-gray-100 text-gray-600" };
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
  const isPremiumMember = profile?.subscription_status === "active" || profile?.subscription_status === "canceling";
  const avatarUrl = profile?.avatar_url;
  const adminEmail = (process.env.OKIPOKA_ADMIN_EMAIL ?? "okipoka.jp@gmail.com").toLowerCase();
  const isAdmin = (user.email ?? "").toLowerCase() === adminEmail;
  const isSubscriber = profile?.subscription_status === 'active' || profile?.subscription_status === 'canceling';
  const subscriptionStatus = formatSubscriptionStatus(profile?.subscription_status);

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* プロフィールヒーロー */}
      <div className="relative bg-gray-900 overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-br from-orange-600/20 via-transparent to-purple-600/20" />
        <div className="relative max-w-5xl mx-auto px-4 pt-8 pb-10 md:pt-12 md:pb-14">
          <div className="flex items-center gap-4 md:gap-6">
            {/* アバター */}
            <div className="w-16 h-16 md:w-20 md:h-20 bg-white/10 backdrop-blur-sm overflow-hidden shrink-0 border-2 border-white/20">
              {avatarUrl ? (
                <Image
                  src={avatarUrl}
                  alt={displayName}
                  width={80}
                  height={80}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white/60 text-2xl font-bold">
                  {displayName.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl md:text-2xl font-black text-white truncate">{displayName}</h1>
              <div className="flex items-center gap-2 mt-1.5">
                {isPremiumMember && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-yellow-300 bg-yellow-500/15 px-2 py-0.5">
                    <Crown className="w-3 h-3" />
                    PREMIUM
                  </span>
                )}
                {isVip && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-orange-300 bg-orange-500/15 px-2 py-0.5">
                    VIP
                  </span>
                )}
                {!isPremiumMember && !isVip && (
                  <span className="text-[11px] font-medium text-white/40">MEMBER</span>
                )}
              </div>
            </div>
            <Link
              href="/member/profile"
              className="shrink-0 text-xs font-medium text-white/60 hover:text-white border border-white/20 px-3 py-1.5 hover:border-white/40 transition-colors"
            >
              編集
            </Link>
          </div>
        </div>
      </div>

      {/* PC: 2カラム / モバイル: 1カラム */}
      <div className="max-w-5xl mx-auto px-4 -mt-4 md:flex md:gap-6 md:items-start">

        {/* 左カラム: メインコンテンツ */}
        <div className="md:flex-1 md:min-w-0 space-y-4">

          {/* 会員証 */}
          <section>
            <DigitalMemberCard isVip={isVip} isPremium={isPremiumMember} userName={displayName} avatarUrl={avatarUrl} />
          </section>

          {/* プレミアムセクション */}
          <section className="bg-white shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 bg-linear-to-r from-orange-50 to-amber-50">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-orange-900 flex items-center gap-2 text-sm">
                  <Crown className="w-4 h-4 text-orange-500" />
                  おきぽかプレミアム
                </h3>
                <span className={`px-2 py-0.5 text-[11px] font-bold ${subscriptionStatus.className}`}>
                  {subscriptionStatus.label}
                </span>
              </div>
            </div>

            {!isSubscriber ? (
              <Link href="/member/subscription" className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors group">
                <div className="w-10 h-10 bg-orange-100 flex items-center justify-center shrink-0">
                  <Crown className="w-5 h-5 text-orange-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900 group-hover:text-orange-500 transition-colors">プレミアム会員登録</p>
                  <p className="text-xs text-gray-500 mt-0.5">月額2,200円で毎日ガチャが引ける！</p>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-300" />
              </Link>
            ) : (
              <div className="divide-y divide-gray-100">
                <Link href="/member/subscription" className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors group">
                  <div className="w-10 h-10 bg-orange-100 flex items-center justify-center shrink-0">
                    <Crown className="w-5 h-5 text-orange-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900 group-hover:text-orange-500 transition-colors">プレミアム管理</p>
                    <p className="text-xs text-gray-500 mt-0.5">登録状況の確認・解約</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300" />
                </Link>
                <DailyGachaButton lastGachaAt={profile?.last_gacha_at} isAdmin={isAdmin} />
              </div>
            )}
          </section>

          {/* メニュー */}
          <section className="bg-white shadow-sm border border-gray-100 overflow-hidden">
            <div className="divide-y divide-gray-100">
              <MenuLink
                href="/member/items"
                icon={<Ticket className="w-5 h-5" />}
                iconBg="bg-blue-50 text-blue-600"
                label="獲得アイテム"
                sub="チケットやクーポンを確認"
              />
              <MenuLink
                href="/member/profile"
                icon={<User className="w-5 h-5" />}
                iconBg="bg-orange-50 text-orange-600"
                label="プロフィール編集"
                sub="表示名やアイコンの変更"
              />
              <MenuLink
                href="/member/settings"
                icon={<Settings className="w-5 h-5" />}
                iconBg="bg-gray-100 text-gray-600"
                label="設定"
                sub="パスワードの変更"
              />
              {isAdmin && (
                <MenuLink
                  href="/dashboard"
                  icon={<LayoutDashboard className="w-5 h-5" />}
                  iconBg="bg-purple-50 text-purple-600"
                  label="管理者ダッシュボード"
                  sub="サイト管理・設定"
                />
              )}
            </div>
          </section>

          <LogoutButton />
        </div>

        {/* 右カラム: サイドバー（PCのみ） */}
        <div className="hidden md:block md:w-72 md:shrink-0 space-y-4">
          {/* クイックアクション */}
          <div className="bg-white shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100">
              <p className="text-xs font-bold text-gray-500">クイックアクション</p>
            </div>
            <div className="p-3 space-y-2">
              {isSubscriber && (
                <Link
                  href="/member/gacha"
                  className="flex items-center gap-3 px-3 py-2.5 bg-linear-to-r from-orange-500 to-orange-400 text-white hover:from-orange-600 hover:to-orange-500 transition-colors group"
                >
                  <Gift className="w-4 h-4" />
                  <span className="text-sm font-bold">デイリーガチャ</span>
                </Link>
              )}
              <Link
                href="/member/items"
                className="flex items-center gap-3 px-3 py-2.5 bg-gray-50 text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <Ticket className="w-4 h-4 text-blue-500" />
                <span className="text-sm font-medium">アイテム確認</span>
              </Link>
              {!isSubscriber && (
                <Link
                  href="/member/subscription"
                  className="flex items-center gap-3 px-3 py-2.5 bg-orange-50 text-orange-700 hover:bg-orange-100 transition-colors"
                >
                  <Crown className="w-4 h-4" />
                  <span className="text-sm font-bold">プレミアム登録</span>
                </Link>
              )}
            </div>
          </div>

          {/* アカウント情報 */}
          <div className="bg-white shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100">
              <p className="text-xs font-bold text-gray-500">アカウント</p>
            </div>
            <div className="px-4 py-3 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">メール</span>
                <span className="text-gray-700 truncate ml-2">{user.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">ステータス</span>
                <span className={`text-xs font-bold px-2 py-0.5 ${subscriptionStatus.className}`}>
                  {subscriptionStatus.label}
                </span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

function MenuLink({
  href,
  icon,
  iconBg,
  label,
  sub,
}: {
  href: string;
  icon: React.ReactNode;
  iconBg: string;
  label: string;
  sub: string;
}) {
  return (
    <Link href={href} className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors group">
      <div className={`w-10 h-10 flex items-center justify-center shrink-0 ${iconBg}`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-gray-900 group-hover:text-orange-500 transition-colors">{label}</p>
        <p className="text-xs text-gray-500 mt-0.5">{sub}</p>
      </div>
      <ChevronRight className="w-4 h-4 text-gray-300" />
    </Link>
  );
}
