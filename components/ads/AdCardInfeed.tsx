"use client";

import Image from "next/image";
import { Megaphone } from "lucide-react";
import { Ad } from "./AdBanner";
import { AdClickWrapper } from "./AdClickWrapper";

export function AdCardInfeed({ ad }: { ad: Ad }) {
  if (!ad) return null;

  return (
    <AdClickWrapper
      ad={ad}
      className="block"
    >
      <div className="flex items-center gap-4 px-4 py-2.5 border-b border-gray-100 hover:bg-orange-50/30 transition-colors">
        {/* 左: PRバッジ（トーナメントカードの時刻位置に合わせる） */}
        <div className="shrink-0 w-14 text-right">
          <span className="text-[10px] font-bold text-orange-500 bg-orange-50 px-1.5 py-0.5 rounded-full">PR</span>
        </div>

        {/* 中央: タイトル + スポンサー */}
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-bold text-gray-700 truncate">
            {ad.title}
          </h3>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-[11px] text-gray-400">スポンサー</span>
          </div>
        </div>

        {/* 右: 小さなロゴ */}
        <div className="shrink-0 w-9 h-9 rounded-full overflow-hidden relative bg-gray-100 border border-gray-100">
          <Image src={ad.image_url} alt={ad.title} fill className="object-cover" />
        </div>
      </div>
    </AdClickWrapper>
  );
}
