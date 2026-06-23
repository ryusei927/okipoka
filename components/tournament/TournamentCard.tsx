"use client";

import { Store, JapaneseYen, ChevronRight } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { TournamentStatus } from "./TournamentStatus";

interface TournamentCardProps {
  id: string;
  title: string;
  startAt: string;
  lateRegAt?: string | null;
  shopName: string;
  shopImageUrl?: string | null;
  buyIn: string;
  tags?: string[];
  isPremium?: boolean;
}

function formatTimeJST(dateStr: string) {
  return new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(dateStr));
}

export function TournamentCard({
  id,
  title,
  startAt,
  lateRegAt,
  shopName,
  shopImageUrl,
  buyIn,
  tags = [],
  isPremium = false,
}: TournamentCardProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const href = `/tournaments/${id}`;
  const startTime = formatTimeJST(startAt);
  const lateRegTime = lateRegAt ? formatTimeJST(lateRegAt) : null;

  return (
    <Link
      href={href}
      className="block group"
      onClick={(e) => {
        e.preventDefault();
        startTransition(() => router.push(href));
      }}
    >
      <div className={cn(
        "relative flex items-stretch gap-3 px-4 py-3.5 border-b border-gray-100 hover:bg-orange-50/40 transition-colors",
        isPending && "opacity-60"
      )}>
        {/* プレミアム店アクセント */}
        {isPremium && (
          <span className="absolute left-0 top-0 bottom-0 w-1 bg-linear-to-b from-orange-400 to-amber-500" />
        )}

        {/* 時刻チップ */}
        <div className="shrink-0 w-16 flex flex-col items-center justify-center rounded-sm bg-gray-50 border border-gray-100 py-1.5">
          <TournamentStatus startAt={startAt} lateRegAt={lateRegAt} className="text-xl" />
          {lateRegTime && (
            <div className="text-[10px] text-gray-400 leading-tight mt-0.5">〆{lateRegTime}</div>
          )}
        </div>

        {/* 中央: タイトル + バッジ + 店舗 */}
        <div className="flex-1 min-w-0 flex flex-col justify-center gap-1.5">
          <h3 className="text-[15px] font-bold text-gray-900 leading-snug line-clamp-2 group-hover:text-orange-600 transition-colors">
            {title}
          </h3>

          <div className="flex flex-wrap items-center gap-1.5">
            {buyIn && buyIn !== "-" && (
              <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-sm bg-orange-50 text-[11px] font-bold text-orange-600">
                <JapaneseYen className="w-3 h-3" />{buyIn}
              </span>
            )}
            {tags.slice(0, 2).map((tag) => (
              <span key={tag} className="px-2 py-0.5 rounded-sm bg-gray-100 text-[10px] font-medium text-gray-500">
                {tag}
              </span>
            ))}
          </div>

          <div className="flex items-center gap-1.5 text-[11px] text-gray-400 min-w-0">
            {shopImageUrl ? (
              <div className="relative w-4 h-4 rounded-sm overflow-hidden shrink-0 border border-gray-100">
                <Image src={shopImageUrl} alt="" fill className="object-cover" unoptimized />
              </div>
            ) : (
              <Store className="w-3.5 h-3.5 shrink-0" />
            )}
            <span className="truncate">{shopName}</span>
          </div>
        </div>

        {/* 矢印 */}
        <ChevronRight className="self-center shrink-0 w-4 h-4 text-gray-300 group-hover:text-orange-400 transition-colors" />
      </div>
    </Link>
  );
}
