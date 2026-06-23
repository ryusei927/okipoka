"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu, X, ChevronRight, Search, Home, User } from "lucide-react";

const NAV_ITEMS = [
  { href: "/", label: "HOME", icon: true },
  { href: "/shops", label: "店舗情報" },
  { href: "/photos", label: "プレイヤーズフォト" },
  { href: "/about", label: "OKIPOKAとは" },
  { href: "/premium", label: "プレミアム" },
  { href: "/advertise", label: "広告掲載" },
];

export function SiteHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [query, setQuery] = useState("");
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    document.body.style.overflow = isMenuOpen ? "hidden" : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [isMenuOpen]);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    router.push(q ? `/?q=${encodeURIComponent(q)}` : "/");
    setIsMenuOpen(false);
  };

  return (
    <header className="relative z-50">
      {/* 上段: ロゴ + ロケーション + 検索 + CTA */}
      <div className="bg-[#151515]">
        <div className="relative max-w-6xl mx-auto flex items-center gap-4 h-16 md:h-[72px] px-4">
          {/* ロゴ */}
          <Link href="/" className="absolute left-[47%] -translate-x-1/2 md:static md:translate-x-0 flex items-center gap-2 shrink-0">
            <Image src="/logo.png" alt="Logo" width={34} height={34} className="h-8 w-8 rounded-full" priority />
            <span className="text-[22px] font-black tracking-wide leading-none text-white">OKIPOKA</span>
            <span className="hidden sm:inline-flex items-center gap-0.5 text-xs font-medium text-gray-300 ml-1">
              <span
                aria-hidden="true"
                className="inline-block h-3.5 w-3.5 bg-orange-400"
                style={{
                  maskImage: "url(/map.svg)",
                  WebkitMaskImage: "url(/map.svg)",
                  maskSize: "contain",
                  WebkitMaskSize: "contain",
                  maskRepeat: "no-repeat",
                  WebkitMaskRepeat: "no-repeat",
                  maskPosition: "center",
                  WebkitMaskPosition: "center",
                }}
              />
              沖縄
            </span>
          </Link>

          {/* 検索バー (PC) */}
          <form onSubmit={submitSearch} className="hidden md:flex flex-1 max-w-sm ml-auto">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="店舗・トーナメントを検索"
                className="w-full h-8 pl-9 pr-3 text-sm bg-white text-gray-800 rounded-l-full border-0 focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>
            <button
              type="submit"
              className="shrink-0 px-4 h-8 bg-orange-500 hover:bg-orange-600 text-white rounded-r-full flex items-center justify-center transition-colors"
              aria-label="検索"
            >
              <Search className="w-4 h-4" />
            </button>
          </form>

          {/* CTA (PC) */}
          <Link
            href="/member"
            className="hidden md:inline-flex items-center gap-1.5 shrink-0 text-sm font-bold text-gray-300 hover:text-white px-2 py-2 hover:bg-white/5 transition-colors"
          >
            <User className="w-4 h-4" />
            マイページ
          </Link>

          {/* ハンバーガー (モバイル) */}
          <button
            onClick={() => setIsMenuOpen(true)}
            className="md:hidden ml-auto p-2 rounded-lg hover:bg-white/10 transition-colors"
            aria-label="メニュー"
            aria-expanded={isMenuOpen}
          >
            <Menu className="w-6 h-6 text-white" />
          </button>
        </div>
      </div>

      {/* 下段: 横並びナビ帯 (PC) */}
      <nav className="hidden md:block bg-[#151515]">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center overflow-hidden rounded-t-sm bg-[#2a2a2a] border border-black/40 border-b-0 shadow-[0_-1px_0_rgba(255,255,255,0.05)_inset,0_1px_0_rgba(255,255,255,0.08)]">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-1.5 px-4 py-3 text-[13px] font-bold transition-colors border-r border-black/30 last:border-r-0 ${
                isActive(item.href)
                  ? "text-white bg-[#111]"
                  : "text-gray-200 hover:text-white hover:bg-[#1f1f1f]"
              }`}
            >
              {item.icon && <Home className="w-4 h-4" />}
              {item.label}
            </Link>
          ))}
          </div>
        </div>
      </nav>

      {/* モバイルドロワー */}
      <div
        className={`md:hidden fixed inset-0 z-50 transition ${
          isMenuOpen ? "pointer-events-auto" : "pointer-events-none"
        }`}
        aria-hidden={!isMenuOpen}
      >
        <button
          type="button"
          aria-label="メニューを閉じる"
          onClick={() => setIsMenuOpen(false)}
          className={`absolute inset-0 bg-black/45 transition-opacity duration-300 ${
            isMenuOpen ? "opacity-100" : "opacity-0"
          }`}
        />

        <div
          className={`absolute right-0 top-0 h-full w-[min(86vw,360px)] bg-[#151515] shadow-2xl transition-transform duration-300 ease-out ${
            isMenuOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div className="relative flex h-14 items-center justify-end border-b border-white/10 px-4">
            <Link href="/" onClick={() => setIsMenuOpen(false)} className="absolute left-[47%] -translate-x-1/2 flex items-center gap-2">
              <Image src="/logo.png" alt="Logo" width={34} height={34} className="h-8 w-8 rounded-full" priority />
              <span className="text-[22px] font-black tracking-wide leading-none text-white">OKIPOKA</span>
            </Link>
            <button
              type="button"
              onClick={() => setIsMenuOpen(false)}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors"
              aria-label="メニューを閉じる"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>

          {/* モバイル検索 */}
          <form onSubmit={submitSearch} className="flex p-4 pb-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="店舗・トーナメントを検索"
                className="w-full h-10 pl-9 pr-3 text-sm bg-white text-gray-800 rounded-l-full border-0 focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>
            <button type="submit" className="shrink-0 px-4 bg-orange-500 text-white rounded-r-full flex items-center" aria-label="検索">
              <Search className="w-4 h-4" />
            </button>
          </form>

          <nav className="pb-4">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMenuOpen(false)}
                className="flex items-center justify-between px-5 py-3.5 text-sm font-medium text-gray-200 border-b border-white/5 hover:bg-white/5 transition-colors"
              >
                <span className="flex items-center gap-2">
                  {item.icon && <Home className="w-4 h-4" />}
                  {item.label}
                </span>
                <ChevronRight className="w-4 h-4 text-gray-500" />
              </Link>
            ))}
            <Link
              href="/member"
              onClick={() => setIsMenuOpen(false)}
              className="flex items-center justify-center gap-1.5 m-4 bg-white hover:bg-gray-100 text-gray-900 text-sm font-bold px-4 py-3 rounded-sm transition-colors"
            >
              <User className="w-4 h-4" />
              マイページ
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}
