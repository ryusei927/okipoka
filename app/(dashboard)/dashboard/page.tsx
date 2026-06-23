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
    { href: "/dashboard/tournaments", label: "大会管理", desc: "開催予定の大会を編集・削除", icon: Calendar, color: "text-blue-600", bg: "bg-blue-50" },
    { href: "/dashboard/shops", label: "店舗管理", desc: "店舗の一覧・追加・編集", icon: Store, color: "text-emerald-600", bg: "bg-emerald-50" },
    { href: "/dashboard/ads", label: "広告管理", desc: "バナー・スクエア広告の管理", icon: Megaphone, color: "text-pink-600", bg: "bg-pink-50" },
    { href: "/dashboard/members", label: "会員管理", desc: "VIP会員の確認・管理", icon: Users, color: "text-purple-600", bg: "bg-purple-50" },
    { href: "/dashboard/gacha", label: "ガチャ景品管理", desc: "クーポン/当選確率の編集", icon: Dice5, color: "text-red-600", bg: "bg-red-50" },
    { href: "/dashboard/photos", label: "プレイヤーズフォト", desc: "イベント写真のアルバム管理", icon: Camera, color: "text-cyan-600", bg: "bg-cyan-50" },
  ];

  const todayLabel = new Date().toLocaleDateString("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">ダッシュボード</h1>
          <p className="mt-1 text-sm text-gray-500">OKIPOKA 管理画面</p>
        </div>
        <p className="hidden shrink-0 text-xs font-medium text-gray-400 sm:block">{todayLabel}</p>
      </div>

      {/* Quick Action */}
      <Link
        href="/dashboard/tournaments/new"
        className="group flex items-center gap-4 rounded-2xl bg-gradient-to-r from-orange-500 to-orange-600 p-5 text-white shadow-lg shadow-orange-500/20 transition-all hover:shadow-xl hover:shadow-orange-500/30"
      >
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/20">
          <PlusCircle className="h-6 w-6" />
        </div>
        <div className="flex-1">
          <div className="text-base font-bold">大会を作成</div>
          <div className="text-xs text-orange-50/90">新しいトーナメントを追加</div>
        </div>
        <ChevronRight className="h-5 w-5 shrink-0 opacity-70 transition-transform group-hover:translate-x-0.5" />
      </Link>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map(({ label, value, icon: Icon, color, bg }) => (
          <div
            key={label}
            className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
          >
            <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${bg}`}>
              <Icon className={`h-4 w-4 ${color}`} />
            </div>
            <div className="mt-3 text-2xl font-bold tracking-tight text-gray-900">{value}</div>
            <div className="text-xs text-gray-500">{label}</div>
          </div>
        ))}
      </div>

      {/* Menu Grid */}
      <div>
        <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-gray-400">管理メニュー</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {menuItems.map(({ href, label, desc, icon: Icon, color, bg }) => (
            <Link
              key={href}
              href={href}
              className="group flex items-center gap-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-gray-200 hover:shadow-md"
            >
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${bg}`}>
                <Icon className={`h-5 w-5 ${color}`} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-bold text-gray-900">{label}</div>
                <div className="truncate text-xs text-gray-500">{desc}</div>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-gray-300 transition-all group-hover:translate-x-0.5 group-hover:text-gray-500" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
