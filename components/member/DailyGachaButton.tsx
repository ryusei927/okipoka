"use client";

import { Gift } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

type Props = {
  lastGachaAt: string | null;
  isAdmin: boolean;
};

export function DailyGachaButton({ lastGachaAt, isAdmin }: Props) {
  const [canPlay, setCanPlay] = useState(true);
  // マウント直後のハイドレーション不一致を防ぐため
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isAdmin) {
      setCanPlay(true);
      return;
    }

    if (!lastGachaAt) {
      setCanPlay(true);
      return;
    }

    const lastDate = new Date(lastGachaAt);
    const now = new Date();

    // JSTでの日付比較
    const lastJst = lastDate.toLocaleDateString("ja-JP", { timeZone: "Asia/Tokyo" });
    const nowJst = now.toLocaleDateString("ja-JP", { timeZone: "Asia/Tokyo" });

    if (lastJst === nowJst) {
      // 本日プレイ済み
      setCanPlay(false);
    } else {
      setCanPlay(true);
    }
  }, [lastGachaAt, isAdmin]);

  if (!mounted) {
    // SSR時はデフォルトの表示
    return (
      <div className="w-full flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors text-left">
        <div className="p-2 bg-pink-100 text-pink-600 rounded-lg">
          <Gift className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <div className="font-medium text-gray-900">デイリーガチャ</div>
          <div className="text-xs text-gray-500">毎日1回運試し！</div>
        </div>
      </div>
    );
  }

  const content = (
    <>
      <div className={`p-2 rounded-lg ${canPlay ? "bg-pink-100 text-pink-600" : "bg-gray-100 text-gray-400"}`}>
        <Gift className="w-5 h-5" />
      </div>
      <div className="flex-1">
        <div className={`font-medium ${canPlay ? "text-gray-900" : "text-gray-500"}`}>デイリーガチャ</div>
        <div className={`text-xs ${canPlay ? "text-gray-500" : "text-orange-500 font-bold"}`}>
          {canPlay ? "毎日1回運試し！" : "本日はプレイ済みです"}
        </div>
      </div>
    </>
  );

  if (canPlay) {
    return (
      <Link href="/member/gacha" className="w-full flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors text-left">
        {content}
      </Link>
    );
  }

  return (
    <div className="w-full flex items-center gap-3 p-4 bg-gray-50/50 cursor-not-allowed text-left">
      {content}
    </div>
  );
}
