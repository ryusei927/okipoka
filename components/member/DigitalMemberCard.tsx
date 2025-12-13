"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { Crown, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";

export function DigitalMemberCard({ 
  isVip = false, 
  isPremium = false,
  userName = "Guest",
  avatarUrl 
}: { 
  isVip?: boolean; 
  isPremium?: boolean;
  userName?: string;
  avatarUrl?: string | null;
}) {
  const [time, setTime] = useState<Date | null>(null);

  useEffect(() => {
    setTime(new Date());
  }, []);

  if (!time) return <div className="w-full max-w-sm mx-auto aspect-[1.586/1] rounded-2xl bg-gray-200 animate-pulse" />;

  const isGold = isVip || isPremium;
  const rankLabel = isVip ? "VIP PASS" : isPremium ? "PREMIUM" : "MEMBER";

  return (
    <div className="relative w-full max-w-sm mx-auto aspect-[1.586/1] rounded-2xl overflow-hidden shadow-2xl transition-all duration-500 hover:scale-[1.02]">
      {/* 背景アニメーション */}
      <div
        className={cn(
          "absolute inset-0 bg-linear-to-br animate-gradient-xy",
          isGold
            ? "from-yellow-400 via-orange-500 to-red-600"
            : "from-blue-400 via-indigo-500 to-purple-600"
        )}
      />
      
      {/* キラキラエフェクト (VIP/プレミアム) */}
      {isGold && (
        <div className="absolute inset-0 opacity-50 pointer-events-none">
            <div className="absolute top-2 right-2 animate-pulse"><Sparkles className="text-yellow-100 w-6 h-6" /></div>
            <div className="absolute bottom-10 left-4 animate-bounce"><Sparkles className="text-yellow-100 w-4 h-4" /></div>
        </div>
      )}

      {/* カードコンテンツ */}
      <div className="relative h-full flex flex-col justify-between p-6 text-white">
        {/* ヘッダー */}
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-xs font-bold tracking-widest opacity-80">OKIPOKA MEMBER</h2>
            <div className="flex items-center gap-2 mt-1">
              {isGold && <Crown className="w-5 h-5 text-yellow-200 fill-yellow-200" />}
              <span className={cn("text-2xl font-bold tracking-tight", isGold ? "text-yellow-100" : "text-white")}>
                {rankLabel}
              </span>
            </div>
          </div>
          {/* ロゴ的なもの */}
          <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center font-bold text-lg shadow-inner overflow-hidden relative">
            {avatarUrl ? (
              <Image 
                src={avatarUrl} 
                alt={userName} 
                fill 
                className="object-cover"
              />
            ) : (
              "OK"
            )}
          </div>
        </div>

        {/* ユーザー情報 */}
        <div className="space-y-1">
            <p className="text-xs opacity-70">NAME</p>
            <p className="text-lg font-medium truncate">{userName}</p>
        </div>

        {/* フッター */}
        <div className="flex justify-end items-end border-t border-white/20 pt-4">
          <div className="text-right">
            <p className="text-[10px] opacity-70">DATE</p>
            <p className="text-sm font-medium">
              {format(time, "yyyy.MM.dd", { locale: ja })}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
