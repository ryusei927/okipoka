"use client";

import Image from "next/image";
import { useMemo, useState } from "react";

type GachaItem = {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  probability: number;
  type: string;
  value: number | null;
  cost_yen?: number | null;
  expires_days?: number | null;
  is_active?: boolean | null;
  stock_total?: number | null;
  stock_used?: number | null;
};

function isEligible(item: GachaItem): boolean {
  if (!item.is_active) return false;
  if (typeof item.stock_total === "number") {
    return (item.stock_used || 0) < item.stock_total;
  }
  return true;
}

function pickWeighted(items: GachaItem[]): GachaItem | null {
  if (items.length === 0) return null;
  const total = items.reduce((s, it) => s + (it.probability || 0), 0);
  if (total <= 0) return null;
  let r = Math.random() * total;
  for (const it of items) {
    const w = it.probability || 0;
    if (r < w) return it;
    r -= w;
  }
  return items[items.length - 1];
}

export function SimulatorClient({ items }: { items: GachaItem[] }) {
  const eligibleItems = useMemo(() => items.filter(isEligible), [items]);
  const totalWeight = useMemo(
    () => eligibleItems.reduce((s, it) => s + (it.probability || 0), 0),
    [eligibleItems]
  );

  const [last, setLast] = useState<GachaItem | null>(null);
  const [spins, setSpins] = useState(0);
  const [counts, setCounts] = useState<Record<string, number>>({});

  const spinOnce = () => {
    const next = pickWeighted(eligibleItems);
    if (!next) return;
    setLast(next);
    setSpins((n) => n + 1);
    setCounts((prev) => ({ ...prev, [next.id]: (prev[next.id] || 0) + 1 }));
  };

  const reset = () => {
    setLast(null);
    setSpins(0);
    setCounts({});
  };

  const sortedStats = useMemo(() => {
    return eligibleItems
      .map((it) => ({ item: it, count: counts[it.id] || 0 }))
      .sort((a, b) => b.count - a.count);
  }, [eligibleItems, counts]);

  const lastExpiresDays =
    last && last.type !== "none" ? Math.max(0, Number(last.expires_days ?? 30)) : null;

  return (
    <div className="space-y-6">
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="text-sm text-gray-600">
            対象景品: <span className="font-bold text-gray-900">{eligibleItems.length}</span> / 重み合計: {totalWeight}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={reset}
              className="px-4 py-2 rounded-lg font-bold text-sm bg-gray-100 text-gray-700 hover:bg-gray-200"
            >
              リセット
            </button>
            <button
              type="button"
              onClick={spinOnce}
              disabled={eligibleItems.length === 0 || totalWeight <= 0}
              className="px-4 py-2 rounded-lg font-bold text-sm bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-50"
            >
              回す
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="text-sm text-gray-500 mb-4">結果（最新）</div>
        {last ? (
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center overflow-hidden">
              {last.type === "none" ? (
                <span className="text-3xl">😢</span>
              ) : last.image_url ? (
                <div className="relative w-20 h-20">
                  <Image
                    src={last.image_url}
                    alt={last.name}
                    fill
                    sizes="80px"
                    className="object-contain"
                  />
                </div>
              ) : (
                <span className="text-3xl">🎁</span>
              )}
            </div>

            <div className="min-w-0">
              <div className="font-bold text-gray-900 truncate">{last.name}</div>
              {last.description && <div className="text-sm text-gray-600 mt-1">{last.description}</div>}
              <div className="text-xs text-gray-500 mt-2 flex flex-wrap gap-x-4 gap-y-1">
                <span>type: {last.type}</span>
                <span>重み: {last.probability}</span>
                {typeof last.value === "number" && <span>value: {last.value}</span>}
                {typeof last.cost_yen === "number" && <span>原価: {last.cost_yen}円</span>}
                {lastExpiresDays !== null && <span>有効: {lastExpiresDays}日</span>}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-gray-500">まだ回していません</div>
        )}
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <div className="font-bold text-gray-900">集計</div>
            <div className="text-sm text-gray-600 mt-1">試行回数: <span className="font-bold">{spins}</span></div>
          </div>
        </div>

        <div className="mt-4 grid gap-3">
          {sortedStats.map(({ item, count }) => {
            const pct = spins > 0 ? ((count / spins) * 100).toFixed(1) : "0.0";
            return (
              <div key={item.id} className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="font-bold text-gray-900 truncate">{item.name}</div>
                  <div className="text-xs text-gray-500 mt-1">重み: {item.probability}</div>
                </div>
                <div className="text-sm text-gray-700 flex items-center gap-3">
                  <span className="tabular-nums">{count}回</span>
                  <span className="text-gray-500 tabular-nums">({pct}%)</span>
                </div>
              </div>
            );
          })}
          {eligibleItems.length === 0 && (
            <div className="text-gray-500">有効な景品がありません（有効ON、かつ在庫切れでないもの）</div>
          )}
        </div>
      </div>
    </div>
  );
}
