import { DigitalMemberCard } from "@/components/member/DigitalMemberCard";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { signout } from "@/app/login/actions";
import { LogOut, User, Settings, Trophy, LayoutDashboard, Crown, Gift, Ticket } from "lucide-react";
import Link from "next/link";

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
  const avatarUrl = profile?.avatar_url;
  const isAdmin = user.email === 'okipoka.jp@gmail.com';
  const isSubscriber = profile?.subscription_status === 'active';

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
            <DigitalMemberCard isVip={isVip} userName={displayName} avatarUrl={avatarUrl} />
        </section>

        {/* プレミアムメニュー */}
        <section className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100 bg-linear-to-r from-orange-50 to-pink-50">
            <h3 className="font-bold text-orange-800 flex items-center gap-2">
              <Crown className="w-5 h-5" />
              おきぽかプレミアム
            </h3>
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
            <button className="w-full flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors text-left">
                <div className="p-2 bg-yellow-50 text-yellow-600 rounded-lg">
                    <Trophy className="w-5 h-5" />
                </div>
                <div className="flex-1">
                    <div className="font-medium text-gray-900">参加履歴</div>
                    <div className="text-xs text-gray-500">過去に参加したトーナメント</div>
                </div>
            </button>
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
