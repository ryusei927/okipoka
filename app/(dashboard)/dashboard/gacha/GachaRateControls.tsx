"use client";

import { useState, useTransition } from "react";
import { autoAdjustLoseWeightByExpectedValue } from "./actions";
import { useRouter } from "next/navigation";

export function GachaRateControls({
  winRate,
  winWeight,
  loseWeight,
  totalWeight,
  expectedValueYen,
  maxExpectedValueYen,
}: {
  winRate: number;
  winWeight: number;
  loseWeight: number;
  totalWeight: number;
  expectedValueYen: number;
  maxExpectedValueYen: number;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [targetEV, setTargetEV] = useState<number>(
    Math.max(1, Math.round(expectedValueYen || 0))
  );

  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="min-w-0">
          <div className="font-bold text-gray-900">当たり率サマリ</div>
          <div className="text-sm text-gray-600 mt-1">
            現在の当たり率: <span className="font-bold">{winRate.toFixed(1)}%</span>
          </div>
          <div className="text-sm text-gray-600 mt-1">
            現在の期待値（原価）: <span className="font-bold">{expectedValueYen.toFixed(1)}円</span>
          </div>
          <div className="text-xs text-gray-500 mt-1">
            当たり重み: {winWeight} / ハズレ重み: {loseWeight} / 合計: {totalWeight}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            期待値上限（ハズレ重み0相当）: {maxExpectedValueYen.toFixed(1)}円
          </div>
          <div className="text-xs text-gray-400 mt-2">
            ※「ハズレ（type=none）」が1つだけ有効な場合、自動調整できます
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
              className="w-32 px-3 py-2 rounded-lg border border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all"
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
                  await autoAdjustLoseWeightByExpectedValue(targetEV);
                  router.refresh();
                } catch (e: any) {
                  alert(e?.message || "自動調整に失敗しました");
                }
              });
            }}
            className="px-4 py-2 rounded-lg font-bold text-sm bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-50"
          >
            {isPending ? "調整中..." : "期待値で調整"}
          </button>
        </div>
      </div>
    </div>
  );
}
