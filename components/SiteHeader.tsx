"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Menu, X } from "lucide-react";

export function SiteHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-100">
      <div className="max-w-md md:max-w-4xl mx-auto flex items-center justify-between h-[72px] px-4">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/logo.png"
            alt="Logo"
            width={36}
            height={36}
            className="h-9 w-9 rounded-full"
            priority
          />
          <Image
            src="/okipoka.png"
            alt="OKIPOKA"
            width={160}
            height={28}
            className="h-7 w-auto"
            priority
          />
        </Link>

        {/* PCナビ */}
        <nav className="hidden md:flex items-center gap-8">
          <Link href="/" className="text-sm font-medium text-gray-600 hover:text-orange-500 transition-colors">HOME</Link>
          <Link href="/about" className="text-sm font-medium text-gray-600 hover:text-orange-500 transition-colors">OKIPOKAとは</Link>
          <Link href="/shops" className="text-sm font-medium text-gray-600 hover:text-orange-500 transition-colors">店舗情報</Link>
          <Link href="/photos" className="text-sm font-medium text-gray-600 hover:text-orange-500 transition-colors">プレイヤーズフォト</Link>
          <Link href="/ads/contact" className="text-sm font-medium text-gray-600 hover:text-orange-500 transition-colors">広告掲載</Link>
          <Link href="/member" className="text-sm font-medium text-gray-600 hover:text-orange-500 transition-colors">マイページ</Link>
        </nav>

        {/* ハンバーガーボタン (モバイル) */}
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          {isMenuOpen ? <X className="w-6 h-6 text-gray-600" /> : <Menu className="w-6 h-6 text-gray-600" />}
        </button>
      </div>

      {/* モバイルドロップダウンメニュー */}
      {isMenuOpen && (
        <nav className="md:hidden border-t border-gray-100 bg-white">
          <Link href="/" onClick={() => setIsMenuOpen(false)} className="block px-5 py-3.5 text-sm font-medium text-gray-700 border-b border-gray-50 hover:text-orange-500 transition-colors">
            HOME
          </Link>
          <Link href="/about" onClick={() => setIsMenuOpen(false)} className="block px-5 py-3.5 text-sm font-medium text-gray-700 border-b border-gray-50 hover:text-orange-500 transition-colors">
            OKIPOKAとは
          </Link>
          <Link href="/shops" onClick={() => setIsMenuOpen(false)} className="block px-5 py-3.5 text-sm font-medium text-gray-700 border-b border-gray-50 hover:text-orange-500 transition-colors">
            店舗情報
          </Link>
          <Link href="/photos" onClick={() => setIsMenuOpen(false)} className="block px-5 py-3.5 text-sm font-medium text-gray-700 border-b border-gray-50 hover:text-orange-500 transition-colors">
            プレイヤーズフォト
          </Link>
          <Link href="/ads/contact" onClick={() => setIsMenuOpen(false)} className="block px-5 py-3.5 text-sm font-medium text-gray-700 border-b border-gray-50 hover:text-orange-500 transition-colors">
            広告掲載
          </Link>
          <Link href="/member" onClick={() => setIsMenuOpen(false)} className="block px-5 py-3.5 text-sm font-medium text-gray-700 hover:text-orange-500 transition-colors">
            マイページ
          </Link>
        </nav>
      )}
    </header>
  );
}
