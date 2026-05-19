"use client";

import { useState, useTransition } from "react";
import { autoAdjustWinWeightsByExpectedValue } from "./actions";
import { useRouter } from "next/navigation";

export function GachaRateControls({
  expectedValueYen,
  totalWeight,
  winItemCount,
}: {
  expectedValueYen: number;
  totalWeight: number;
  winItemCount: number;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [targetEV, setTargetEV] = useState<number>(180);

  return (
    <div className="bg-white p-4 border border-gray-200">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="min-w-0">
          <div className="font-bold text-gray-900">期待値サマリ</div>
          <div className="text-sm text-gray-700 mt-1 flex items-center gap-2 flex-wrap">
            <span className="text-[10px] px-2 py-0.5 font-bold bg-orange-50 text-orange-700">
              ハズレなし（必ず当たり）
            </span>
          </div>
          <div className="text-sm text-gray-700 mt-1">
            現在の期待値（原価）: <span className="font-bold text-gray-900">{expectedValueYen.toFixed(1)}円</span>
          </div>
          <div className="text-xs text-gray-500 mt-1">
            重み合計: {totalWeight}（対象景品: {winItemCount}件）
          </div>
          <div className="text-xs text-gray-500 mt-2">
            ※期待値は各景品の「重み×原価」で決まります。目標に合わせて当たり景品の重みを自動調整します。
          </div>
        </div>

        <div className="flex items-end gap-6 flex-wrap">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">目標期待値（円）</label>
            <input
              type="number"
              min={1}
              step={1}
              value={targetEV}
              onChange={(e) => setTargetEV(Number(e.target.value))}
              className="w-32 px-3 py-2 border border-gray-200 bg-gray-50 text-gray-900 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all"
              placeholder="例: 180"
            />
            <div className="text-[11px] text-gray-500 mt-1">目安: 150〜200円</div>
          </div>
          <button
            type="button"
            disabled={isPending}
            onClick={() => {
              startTransition(async () => {
                try {
                  await autoAdjustWinWeightsByExpectedValue(targetEV);
                  router.refresh();
                } catch (e: any) {
                  alert(e?.message || "自動調整に失敗しました");
                }
              });
            }}
            className="px-4 py-2 font-bold text-sm bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-50"
          >
            {isPending ? "調整中..." : "期待値で調整"}
          </button>
        </div>
      </div>
    </div>
  );
}
