"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { enableMonthlyLimit } from "./actions";

export function EnableMonthlyLimitButton({ id }: { id: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => {
        if (
          !confirm(
            "「毎月リセットする」をONにします。\n翌月1日（日本時間）から在庫が復活します（今月すでに当選ログがある場合は今月は復活しません）。\nよろしいですか？"
          )
        ) {
          return;
        }
        startTransition(async () => {
          try {
            await enableMonthlyLimit(id);
            router.refresh();
          } catch (e: unknown) {
            alert(e instanceof Error ? e.message : "更新に失敗しました");
          }
        });
      }}
      className="text-xs font-bold text-blue-700 underline hover:text-blue-900 disabled:opacity-50"
    >
      {isPending ? "設定中..." : "月間リセットをONにする"}
    </button>
  );
}
