import { Calendar, Store, Users, PlusCircle, Megaphone, Dice5, Camera, ChevronRight, CreditCard } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createClient();

  // 統計データ取得
  const now = new Date();
  const sixHoursAgoIso = new Date(now.getTime() - 6 * 60 * 60 * 1000).toISOString();

  const [
    { count: tournamentCount },
    { count: shopCount },
    { count: memberCount },
    { count: premiumCount },
  ] = await Promise.all([
    supabase.from("tournaments").select("*", { count: "exact", head: true }).gte("start_at", sixHoursAgoIso),
    supabase.from("shops").select("*", { count: "exact", head: true }),
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("profiles").select("*", { count: "exact", head: true }).or("is_vip.eq.true,subscription_status.eq.active"),
  ]);

  const stats = [
    { label: "開催予定", value: tournamentCount ?? 0, icon: Calendar, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "店舗数", value: shopCount ?? 0, icon: Store, color: "text-emerald-600", bg: "bg-emerald-50" },
    { label: "会員数", value: memberCount ?? 0, icon: Users, color: "text-purple-600", bg: "bg-purple-50" },
    { label: "プレミアム", value: premiumCount ?? 0, icon: CreditCard, color: "text-orange-600", bg: "bg-orange-50" },
  ];

  const menuItems = [
    { href: "/dashboard/tournaments", label: "大会管理", desc: "開催予定の大会を編集・削除", icon: Calendar, color: "text-blue-600" },
    { href: "/dashboard/shops", label: "店舗管理", desc: "店舗の一覧・追加・編集", icon: Store, color: "text-emerald-600" },
    { href: "/dashboard/ads", label: "広告管理", desc: "バナー・スクエア広告の管理", icon: Megaphone, color: "text-pink-600" },
    { href: "/dashboard/members", label: "会員管理", desc: "VIP会員の確認・管理", icon: Users, color: "text-purple-600" },
    { href: "/dashboard/gacha", label: "ガチャ景品管理", desc: "クーポン/当選確率の編集", icon: Dice5, color: "text-red-600" },
    { href: "/dashboard/photos", label: "プレイヤーズフォト", desc: "イベント写真のアルバム管理", icon: Camera, color: "text-cyan-600" },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-gray-900">ダッシュボード</h1>
        <p className="text-sm text-gray-500 mt-1">OKIPOKA管理画面</p>
      </div>

      {/* Quick Action */}
      <Link
        href="/dashboard/tournaments/new"
        className="block p-4 bg-orange-500 text-white font-bold hover:bg-orange-600 transition-colors"
      >
        <div className="flex items-center gap-3">
          <PlusCircle className="w-6 h-6" />
          <div>
            <div className="text-base">大会を作成</div>
            <div className="text-xs font-normal text-orange-100">新しいトーナメントを追加</div>
          </div>
          <ChevronRight className="w-5 h-5 ml-auto opacity-60" />
        </div>
      </Link>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-white border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 ${bg}`}>
                <Icon className={`w-4 h-4 ${color}`} />
              </div>
              <div>
                <div className="text-2xl font-black text-gray-900">{value}</div>
                <div className="text-[11px] text-gray-500">{label}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Menu Grid */}
      <div>
        <h2 className="text-sm font-bold text-gray-500 mb-3">管理メニュー</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-gray-200 border border-gray-200">
          {menuItems.map(({ href, label, desc, icon: Icon, color }) => (
            <Link
              key={href}
              href={href}
              className="bg-white p-4 flex items-center gap-3 hover:bg-gray-50 transition-colors"
            >
              <Icon className={`w-5 h-5 ${color} shrink-0`} />
              <div className="flex-1 min-w-0">
                <div className="font-bold text-gray-900 text-sm">{label}</div>
                <div className="text-[11px] text-gray-500 truncate">{desc}</div>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-500 shrink-0" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
