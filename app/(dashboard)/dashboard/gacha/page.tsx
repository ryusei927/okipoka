import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Plus, Dice5 } from "lucide-react";
import { GachaItemRow } from "./GachaItemRow";
import { GachaRateControls } from "./GachaRateControls";

export default async function GachaPage() {
  const supabase = await createClient();

  const { data: items, error } = await supabase
    .from("gacha_items")
    .select("*")
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  const activeItems = (items || []).filter((it: any) => {
    if (!it.is_active) return false;
    if (typeof it.stock_total === "number") {
      return (it.stock_used || 0) < it.stock_total;
    }
    return true;
  });

  const outOfStockActiveCount = (items || []).filter((it: any) => {
    if (!it.is_active) return false;
    if (it.deleted_at) return false;
    if (typeof it.stock_total !== "number") return false;
    return (it.stock_used || 0) >= it.stock_total;
  }).length;
  const totalWeight = activeItems.reduce(
    (sum: number, it: any) => sum + (it.probability || 0),
    0
  );
  const winWeight = activeItems
    .filter((it: any) => it.type !== "none")
    .reduce((sum: number, it: any) => sum + (it.probability || 0), 0);
  const loseWeight = activeItems
    .filter((it: any) => it.type === "none")
    .reduce((sum: number, it: any) => sum + (it.probability || 0), 0);
  const winRate = totalWeight > 0 ? (winWeight / totalWeight) * 100 : 0;

  const winCostSum = activeItems
    .filter((it: any) => it.type !== "none")
    .reduce((sum: number, it: any) => sum + (it.probability || 0) * (it.cost_yen || 0), 0);

  const expectedValueYen = totalWeight > 0 ? winCostSum / totalWeight : 0;
  const maxExpectedValueYen = winWeight > 0 ? winCostSum / winWeight : 0;

  return (
    <div className="pb-20 space-y-6">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Dice5 className="w-6 h-6 text-gray-400" />
          <h1 className="text-xl font-bold text-gray-900">ガチャ景品管理</h1>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/gacha/sim"
            className="flex items-center gap-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg font-bold text-sm hover:bg-gray-200 transition-colors"
          >
            シミュレーション
          </Link>
          <Link
            href="/dashboard/gacha/new"
            className="flex items-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-lg font-bold text-sm shadow-sm hover:bg-orange-600 transition-colors"
          >
            <Plus className="w-4 h-4" />
            追加
          </Link>
        </div>
      </header>

      {error && (
        <div className="bg-white p-4 rounded-xl shadow-sm border border-red-200 text-sm text-red-700">
          gacha_items の取得に失敗しました: {error.message}
        </div>
      )}

      {!error && (items?.length || 0) > 0 && (
        <>
          {outOfStockActiveCount > 0 && (
            <div className="bg-amber-50 border border-amber-200 text-amber-800 text-sm rounded-xl p-4">
              在庫切れの景品が {outOfStockActiveCount} 件あります。抽選/当たり率/期待値の計算は在庫切れを除外します（実際の抽選と同じ挙動）。
            </div>
          )}
          <GachaRateControls
            winRate={winRate}
            winWeight={winWeight}
            loseWeight={loseWeight}
            totalWeight={totalWeight}
            expectedValueYen={expectedValueYen}
            maxExpectedValueYen={maxExpectedValueYen}
          />
        </>
      )}

      <div className="grid gap-4">
        {items?.map((item: any) => {
          const pct =
            item.is_active && totalWeight > 0
              ? ((item.probability / totalWeight) * 100).toFixed(1)
              : null;
          return (
            <div key={item.id}>
              <GachaItemRow item={item} />
              {pct && (
                <div className="text-xs text-gray-500 mt-1 ml-1">
                  出現割合（概算）: {pct}%
                </div>
              )}
            </div>
          );
        })}

        {items?.length === 0 && (
          <div className="text-center py-10 text-gray-500">
            景品がまだ登録されていません
          </div>
        )}
      </div>
    </div>
  );
}
