import { DigitalMemberCard } from "@/components/member/DigitalMemberCard";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { signout } from "@/app/login/actions";
import { LogOut, User, Settings, LayoutDashboard, Crown, Gift, Ticket } from "lucide-react";
import Link from "next/link";

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
      <header className="bg-white border-b border-gray-100 px-4 py-3 sticky top-0 z-10">
        <h1 className="text-lg font-bold text-gray-900 text-center">マイページ</h1>
      </header>

      <div className="p-4 space-y-6 max-w-md mx-auto">
        {/* 会員証セクション */}
        <section>
            <div className="mb-2 flex items-center justify-between px-1">
                <h2 className="text-sm font-bold text-gray-500">デジタル会員証</h2>
            </div>
            <DigitalMemberCard isVip={isVip} isPremium={isPremiumMember} userName={displayName} avatarUrl={avatarUrl} />
        </section>

        {/* プレミアムメニュー */}
        <section className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100 bg-linear-to-r from-orange-50 to-pink-50">
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-bold text-orange-800 flex items-center gap-2">
                <Crown className="w-5 h-5" />
                おきぽかプレミアム
              </h3>
              <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${subscriptionStatus.className}`}>
                {subscriptionStatus.label}
              </span>
            </div>
          </div>
          <div className="divide-y divide-gray-100">
            {!isSubscriber ? (
              <Link href="/member/subscription" className="w-full flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors text-left">
                <div className="p-2 bg-orange-100 text-orange-600 rounded-lg">
                  <Crown className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="font-medium text-gray-900">プレミアム会員登録</div>
                  <div className="text-xs text-gray-500">月額2,200円で毎日ガチャ！</div>
                </div>
              </Link>
            ) : (
              <>
                <Link href="/member/subscription" className="w-full flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors text-left">
                  <div className="p-2 bg-orange-100 text-orange-600 rounded-lg">
                    <Crown className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">プレミアム管理</div>
                    <div className="text-xs text-gray-500">登録状況の確認・解約</div>
                  </div>
                </Link>
                <Link href="/member/gacha" className="w-full flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors text-left">
                  <div className="p-2 bg-pink-100 text-pink-600 rounded-lg">
                    <Gift className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">デイリーガチャ</div>
                    <div className="text-xs text-gray-500">毎日1回運試し！</div>
                  </div>
                </Link>
                <Link href="/member/items" className="w-full flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors text-left">
                  <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                    <Ticket className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">獲得アイテム</div>
                    <div className="text-xs text-gray-500">チケットやクーポンを確認</div>
                  </div>
                </Link>
              </>
            )}
          </div>
        </section>

        {/* メニューセクション */}
        <section className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="divide-y divide-gray-100">
            <Link href="/member/profile" className="w-full flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors text-left">
                <div className="p-2 bg-orange-50 text-orange-600 rounded-lg">
                    <User className="w-5 h-5" />
                </div>
                <div className="flex-1">
                    <div className="font-medium text-gray-900">プロフィール編集</div>
                    <div className="text-xs text-gray-500">表示名やアイコンの変更</div>
                </div>
            </Link>
            <Link href="/member/settings" className="w-full flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors text-left">
                <div className="p-2 bg-gray-50 text-gray-600 rounded-lg">
                    <Settings className="w-5 h-5" />
                </div>
                <div className="flex-1">
                    <div className="font-medium text-gray-900">設定</div>
                    <div className="text-xs text-gray-500">通知設定など</div>
                </div>
            </Link>
            {isAdmin && (
              <Link href="/dashboard" className="w-full flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors text-left">
                  <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                      <LayoutDashboard className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                      <div className="font-medium text-gray-900">管理者ダッシュボード</div>
                      <div className="text-xs text-gray-500">サイト管理・設定</div>
                  </div>
              </Link>
            )}
          </div>
        </section>

        {/* ログアウトボタン */}
        <form action={signout}>
            <button className="w-full flex items-center justify-center gap-2 p-4 text-red-600 bg-white rounded-xl shadow-sm border border-gray-100 hover:bg-red-50 transition-colors font-medium">
                <LogOut className="w-5 h-5" />
                ログアウト
            </button>
        </form>
      </div>
    </div>
  );
}
