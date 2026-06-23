"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { Crown } from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";

export function DigitalMemberCard({
  isVip = false,
  isPremium = false,
  userName = "Guest",
  avatarUrl,
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

  if (!time)
    return <div className="w-full max-w-md mx-auto aspect-[1.586/1] bg-gray-100 animate-pulse rounded-3xl" />;

  const isGold = isVip || isPremium;
  const rankLabel = isVip ? "VIP PASS" : isPremium ? "PREMIUM" : "MEMBER";

  return (
    <div
      className={cn(
        "relative w-full max-w-md mx-auto aspect-[1.586/1] overflow-hidden rounded-3xl bg-white shadow-sm transition-transform duration-300 hover:-translate-y-0.5",
        isGold ? "ring-1 ring-amber-200" : "ring-1 ring-gray-200"
      )}
    >
      {/* 背景: 上品な淡いグラデーション */}
      <div
        className={cn(
          "absolute inset-0",
          isGold
            ? "bg-linear-to-br from-amber-50 via-white to-orange-50/60"
            : "bg-linear-to-br from-gray-50 via-white to-gray-100"
        )}
      />

      {/* 上部のアクセントライン */}
      <div
        className={cn(
          "absolute inset-x-0 top-0 h-1",
          isGold ? "bg-linear-to-r from-amber-300 to-orange-400" : "bg-linear-to-r from-gray-300 to-gray-400"
        )}
      />

      {/* コンテンツ */}
      <div className="relative h-full flex flex-col justify-between p-6">
        {/* ヘッダー */}
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-[11px] font-semibold tracking-[0.18em] text-gray-400">OKIPOKA MEMBER</h2>
            <div className="flex items-center gap-1.5 mt-1.5">
              {isGold && <Crown className="w-5 h-5 text-amber-500 fill-amber-400" />}
              <span
                className={cn(
                  "text-2xl font-bold tracking-tight",
                  isGold ? "text-amber-600" : "text-gray-800"
                )}
              >
                {rankLabel}
              </span>
            </div>
          </div>

          {/* アバター */}
          <div
            className={cn(
              "w-11 h-11 rounded-full bg-gray-100 flex items-center justify-center font-bold text-sm overflow-hidden relative shrink-0",
              isGold ? "ring-1 ring-amber-200" : "ring-1 ring-gray-200"
            )}
          >
            {avatarUrl ? (
              <Image src={avatarUrl} alt={userName} fill className="object-cover" unoptimized />
            ) : (
              <span className="text-gray-400">{userName.charAt(0).toUpperCase()}</span>
            )}
          </div>
        </div>

        {/* ユーザー名 */}
        <div className="space-y-0.5">
          <p className="text-[10px] tracking-widest text-gray-400">NAME</p>
          <p className="text-lg font-semibold text-gray-900 truncate">{userName}</p>
        </div>

        {/* フッター */}
        <div className="flex justify-between items-end border-t border-gray-100 pt-3">
          <span className={cn("text-[10px] font-bold tracking-widest", isGold ? "text-amber-500" : "text-gray-400")}>
            OKIPOKA.COM
          </span>
          <div className="text-right">
            <p className="text-[10px] tracking-widest text-gray-400">SINCE</p>
            <p className="text-sm font-semibold text-gray-700 tabular-nums">{format(time, "yyyy.MM.dd", { locale: ja })}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
