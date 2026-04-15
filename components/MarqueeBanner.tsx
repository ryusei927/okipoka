"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";

const HIDDEN_PATHS = ["/member", "/tournaments/"];

export function MarqueeBanner() {
  const pathname = usePathname();

  if (HIDDEN_PATHS.some(p => pathname.startsWith(p))) return null;

  return (
    <div className="bg-white text-gray-600 overflow-hidden py-2 border-b border-gray-100">
      <p className="md:hidden text-[11px] tracking-wide whitespace-nowrap animate-marquee">
        沖縄のポーカー情報を全てここに。トーナメントや店舗の情報をリアルタイムでお届け　　　<Link href="/premium" className="underline hover:text-orange-300 transition-colors">OKIPOKAプレミアム</Link>会員募集中　　　沖縄のポーカー情報を全てここに。トーナメントや店舗の情報をリアルタイムでお届け　　　<Link href="/premium" className="underline hover:text-orange-300 transition-colors">OKIPOKAプレミアム</Link>会員募集中
      </p>
      <p className="hidden md:block text-[11px] tracking-wide text-center">
        沖縄のポーカー情報を全てここに。トーナメントや店舗の情報をリアルタイムでお届け　｜　<Link href="/premium" className="underline hover:text-orange-300 transition-colors">OKIPOKAプレミアム</Link>会員募集中
      </p>
    </div>
  );
}
