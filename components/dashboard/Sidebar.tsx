"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Calendar,
  Store,
  Megaphone,
  Users,
  Dice5,
  Camera,
  ExternalLink,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/dashboard", label: "ダッシュボード", icon: LayoutDashboard, exact: true },
  { href: "/dashboard/tournaments", label: "大会管理", icon: Calendar },
  { href: "/dashboard/shops", label: "店舗管理", icon: Store },
  { href: "/dashboard/ads", label: "広告管理", icon: Megaphone },
  { href: "/dashboard/members", label: "会員管理", icon: Users },
  { href: "/dashboard/gacha", label: "ガチャ景品", icon: Dice5 },
  { href: "/dashboard/photos", label: "フォト", icon: Camera },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex lg:flex-col lg:w-60 lg:fixed lg:inset-y-0 bg-white border-r border-gray-200 z-40">
      {/* Logo */}
      <div className="h-14 flex items-center px-5 border-b border-gray-200">
        <Link href="/dashboard" className="text-lg font-black tracking-tight text-gray-900">
          OKIPOKA<span className="text-orange-500 ml-1.5 text-xs font-bold">ADMIN</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {NAV_ITEMS.map(({ href, label, icon: Icon, exact }) => {
          const isActive = exact ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-orange-500 text-white"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              }`}
            >
              <Icon className="w-4.5 h-4.5 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-gray-200">
        <Link
          href="/"
          className="flex items-center gap-2 px-3 py-2.5 text-sm text-gray-400 hover:text-gray-900 transition-colors"
        >
          <ExternalLink className="w-4 h-4" />
          サイトへ戻る
        </Link>
      </div>
    </aside>
  );
}

export function BottomNav() {
  const pathname = usePathname();

  const BOTTOM_ITEMS = NAV_ITEMS.slice(0, 5); // モバイルは主要5項目

  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 bg-white border-t border-gray-200 z-40 safe-area-pb">
      <div className="flex justify-around items-center h-14">
        {BOTTOM_ITEMS.map(({ href, label, icon: Icon, exact }) => {
          const isActive = exact ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-0.5 px-2 py-1 text-[10px] font-medium transition-colors ${
                isActive ? "text-orange-500" : "text-gray-400"
              }`}
            >
              <Icon className="w-5 h-5" />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
