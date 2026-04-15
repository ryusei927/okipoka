"use client";

import { Store, JapaneseYen } from "lucide-react";
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
        "flex items-start gap-4 px-4 py-3 border-b border-gray-100 hover:bg-gray-50/80 transition-colors",
        isPending && "opacity-60"
      )}>
        {/* 時刻 / ステータス */}
        <div className="shrink-0 w-16 pt-0.5 text-right">
          <TournamentStatus startAt={startAt} lateRegAt={lateRegAt} className="text-lg" />
          {lateRegTime && (
            <div className="text-[11px] text-gray-400 leading-tight">{lateRegTime}</div>
          )}
        </div>

        {/* 中央: タイトル + メタ情報 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2">
            <h3 className="text-sm font-bold text-gray-900 truncate group-hover:text-orange-600 transition-colors">
              {title}
            </h3>
            {buyIn && buyIn !== "-" && (
              <span className="shrink-0 inline-flex items-center gap-0.5 text-xs text-gray-500">
                <JapaneseYen className="w-3 h-3 text-orange-400" />{buyIn.toLocaleString()}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-gray-400">
            {tags.length > 0 && (
              <>
                <span>{tags[0]}</span>
                <span>·</span>
              </>
            )}
            <div className="flex items-center gap-1 min-w-0">
              {shopImageUrl ? (
                <div className="relative w-3.5 h-3.5 rounded-full overflow-hidden shrink-0">
                  <Image src={shopImageUrl} alt="" fill className="object-cover" />
                </div>
              ) : (
                <Store className="w-3 h-3 shrink-0" />
              )}
              <span className="truncate">{shopName}</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
