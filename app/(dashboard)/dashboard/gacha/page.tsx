import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Plus, Dice5 } from "lucide-react";
import { GachaItemRow } from "./GachaItemRow";
import { GachaRateControls } from "./GachaRateControls";
import {
  computeGachaRateStats,
  gachaAppearancePct,
} from "@/lib/gacha";

export default async function GachaPage() {
  const supabase = await createClient();

  const { data: items, error } = await supabase.rpc("get_admin_gacha_items");

  const stats = computeGachaRateStats(items || []);
  const { totalWeight, expectedValueYen, eligibleItems } = stats;
  const winItemCount = eligibleItems.filter((it) => it.type !== "none").length;

  const outOfStockActiveCount = (items || []).filter((it: any) => {
    if (!it.is_active) return false;
    if (it.deleted_at) return false;
    if (typeof it.stock_total !== "number") return false;
    return (it.current_stock_used || 0) >= it.stock_total;
  }).length;

  return (
    <div className="pb-20 space-y-6">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Dice5 className="w-6 h-6 text-gray-500" />
          <h1 className="text-xl font-bold text-gray-900">ガチャ景品管理</h1>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/gacha/sim"
            className="flex items-center gap-2 bg-gray-50 text-gray-700 px-4 py-2 font-bold text-sm hover:bg-gray-100 transition-colors"
          >
            シミュレーション
          </Link>
          <Link
            href="/dashboard/gacha/new"
            className="flex items-center gap-2 bg-orange-500 text-white px-4 py-2 font-bold text-sm hover:bg-orange-600 transition-colors"
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
            <div className="bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm p-4">
              在庫切れの景品が {outOfStockActiveCount} 件あります。抽選/当たり率/期待値の計算は在庫切れを除外します（実際の抽選と同じ挙動）。
            </div>
          )}
          <GachaRateControls
            expectedValueYen={expectedValueYen}
            totalWeight={totalWeight}
            winItemCount={winItemCount}
          />
        </>
      )}

      <div className="grid gap-4">
        {items?.map((item: any) => {
          const pct = gachaAppearancePct(item, totalWeight);
          const outOfStock =
            item.is_active &&
            typeof item.stock_total === "number" &&
            (item.current_stock_used || 0) >= item.stock_total;
          return (
            <div key={item.id}>
              <GachaItemRow item={item} />
              {pct && (
                <div className="text-xs text-gray-500 mt-1 ml-1">
                  出現割合（概算・抽選対象のみ）: {pct}%
                </div>
              )}
              {outOfStock && (
                <div className="text-xs text-red-600 mt-1 ml-1 font-bold">
                  在庫切れのため抽選対象外
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
