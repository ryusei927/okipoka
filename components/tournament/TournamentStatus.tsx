"use client";

import { useEffect, useState } from "react";
import { format, differenceInMinutes, addHours } from "date-fns";

import { cn } from "@/lib/utils";

export function TournamentStatus({ 
  startAt, 
  lateRegAt,
  className 
}: { 
  startAt: string; 
  lateRegAt?: string | null;
  className?: string;
}) {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // マウント前（サーバーサイドレンダリング時）は開始時間を表示してハイドレーションエラーを防ぐ
  if (!now) {
    return (
      <span 
        className={cn("text-2xl font-bold text-orange-500", className)}
        suppressHydrationWarning
      >
        {format(new Date(startAt), "HH:mm")}
      </span>
    );
  }

  const startDate = new Date(startAt);
  // 締切(Late Reg)がある場合はそれを終了時間とし、ない場合は開始から6時間後とする
  const endDate = lateRegAt ? new Date(lateRegAt) : addHours(startDate, 6);

  const diffInMinutes = differenceInMinutes(startDate, now);

  if (now >= endDate) {
    return <span className={cn("text-gray-500 font-bold", className)}>終了</span>;
  }

  if (now >= startDate) {
    return <span className={cn("text-red-500 font-bold animate-pulse", className)}>開催中</span>;
  }

  if (diffInMinutes <= 60 && diffInMinutes > 0) {
    return <span className={cn("text-orange-600 font-bold", className)}>{diffInMinutes}分後</span>;
  }

  return (
    <span className={cn("text-2xl font-bold text-orange-500", className)}>
      {format(startDate, "HH:mm")}
    </span>
  );
}
