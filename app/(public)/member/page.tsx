import { DigitalMemberCard } from "@/components/member/DigitalMemberCard";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { signout } from "@/app/login/actions";
import { LogOut, User, Settings, Trophy, LayoutDashboard } from "lucide-react";
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
