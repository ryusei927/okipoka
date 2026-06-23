"use client";

import Link from "next/link";
import { Pencil, PackagePlus, Loader2 } from "lucide-react";
import { useState, useTransition } from "react";
import { DeleteButton } from "./DeleteButton";
import { toggleGachaItemStatus, addGachaStock } from "./actions";
import { useRouter } from "next/navigation";
import { EnableMonthlyLimitButton } from "./EnableMonthlyLimitButton";

function typeLabel(type?: string | null) {
  switch (type) {
    case "drink_ticket":
      return "ドリンク";
    case "discount_coupon":
      return "割引";
    case "ring_chip":
      return "チップ";
    case "other":
      return "その他";
    case "none":
      return "ハズレ";
    default:
      return type || "-";
  }
}

export function GachaItemRow({
  item,
  shopName,
}: {
  item: any;
  shopName?: string | null;
}) {
  const [isPending, startTransition] = useTransition();
  const [restocking, setRestocking] = useState(false);
  const [restockOpen, setRestockOpen] = useState(false);
  const [restockError, setRestockError] = useState<string | null>(null);
  const router = useRouter();

  const isLimitedStock = typeof item.stock_total === "number";
  const isOutOfStock =
    isLimitedStock && (item.current_stock_used || 0) >= item.stock_total;
  const needsMonthlyHint =
    isOutOfStock && item.is_active && !item.is_monthly_limit;

  function handleRestock(amount: number) {
    setRestockError(null);
    setRestocking(true);
    startTransition(async () => {
      try {
        await addGachaStock(item.id, amount);
        setRestockOpen(false);
        router.refresh();
      } catch (e: any) {
        setRestockError(e?.message || "補充に失敗しました");
      } finally {
        setRestocking(false);
      }
    });
  }

  return (
    <div className="bg-white p-4 border border-gray-200">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="font-bold text-gray-900 truncate">{item.name}</div>
            <span className="text-[10px] px-2 py-0.5 font-bold bg-gray-50 text-gray-700">
              {typeLabel(item.type)}
            </span>
            <span
              className={`text-[10px] px-2 py-0.5 font-bold ${
                item.is_active ? "bg-green-50 text-green-700" : "bg-gray-50 text-gray-500"
              }`}
            >
              {item.is_active ? "有効" : "無効"}
            </span>
            <span className="text-[10px] px-2 py-0.5 font-bold bg-blue-50 text-blue-700">
              店舗: {shopName || "共通（指定なし）"}
            </span>
          </div>

          {item.description && (
            <div className="text-sm text-gray-700 mt-1">{item.description}</div>
          )}

          <div className="text-xs text-gray-500 mt-2 flex flex-wrap gap-x-4 gap-y-1">
            <span>重み: {item.probability}</span>
            {item.type !== "none" && (
              <span>原価: {typeof item.cost_yen === "number" ? `${item.cost_yen}円` : "0円"}</span>
            )}
            <span>value: {typeof item.value === "number" ? item.value : "-"}</span>
            {typeof item.stock_total === "number" ? (
              <span className={(item.current_stock_used || 0) >= item.stock_total ? "text-red-600 font-bold" : ""}>
                残り: {Math.max(0, item.stock_total - (item.current_stock_used || 0))} / {item.stock_total}
                {item.is_monthly_limit && <span className="text-[10px] bg-blue-50 text-blue-700 px-1 py-0.5 ml-1">月間</span>}
              </span>
            ) : (
              <span className="text-blue-700 font-medium">在庫: 無制限</span>
            )}
            {typeof item.limit_per_user === "number" && (
              <span className="text-purple-700 font-medium">
                1人{item.limit_per_user}回まで
                {item.is_monthly_limit && <span className="text-[10px] bg-blue-50 text-blue-700 px-1 py-0.5 ml-1">月間</span>}
              </span>
            )}
            {typeof item.stock_total === "number" && !item.is_monthly_limit && (
              <span className="text-amber-700 font-medium">累積在庫（手動リセットまで復活しません）</span>
            )}
          </div>
          {needsMonthlyHint && (
            <div className="text-xs text-amber-800 mt-2 bg-amber-50 border border-amber-200 p-2 space-y-1">
              <p>
                「月間」がOFFのため、当選後は翌月も復活しません。毎月の排出枠として使う場合は「毎月リセットする」をONにしてください。
              </p>
              <EnableMonthlyLimitButton id={item.id} />
            </div>
          )}

          {isLimitedStock && (
            <div className="mt-2">
              {!restockOpen ? (
                <button
                  type="button"
                  onClick={() => {
                    setRestockOpen(true);
                    setRestockError(null);
                  }}
                  className="inline-flex items-center gap-1 text-xs font-bold text-orange-600 hover:text-orange-700"
                >
                  <PackagePlus className="w-3.5 h-3.5" />
                  在庫を補充
                </button>
              ) : (
                <div className="flex flex-wrap items-center gap-2 rounded-md border border-orange-200 bg-orange-50/60 p-2">
                  <span className="text-xs font-bold text-orange-700">補充：</span>
                  <button
                    type="button"
                    disabled={restocking}
                    onClick={() => handleRestock(5)}
                    className="px-2 py-1 text-xs font-bold bg-white border border-orange-200 text-orange-700 hover:bg-orange-100 disabled:opacity-50"
                  >
                    +5
                  </button>
                  <button
                    type="button"
                    disabled={restocking}
                    onClick={() => handleRestock(10)}
                    className="px-2 py-1 text-xs font-bold bg-white border border-orange-200 text-orange-700 hover:bg-orange-100 disabled:opacity-50"
                  >
                    +10
                  </button>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      const input = e.currentTarget.elements.namedItem(
                        "amount"
                      ) as HTMLInputElement | null;
                      const v = Number(input?.value);
                      if (Number.isFinite(v) && v > 0) handleRestock(v);
                    }}
                    className="flex items-center gap-1"
                  >
                    <input
                      name="amount"
                      type="number"
                      min={1}
                      placeholder="数量"
                      disabled={restocking}
                      className="w-16 px-2 py-1 text-xs border border-orange-200 rounded-sm focus:outline-none focus:ring-1 focus:ring-orange-400 disabled:opacity-50"
                    />
                    <button
                      type="submit"
                      disabled={restocking}
                      className="inline-flex items-center gap-1 px-2 py-1 text-xs font-bold bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-50"
                    >
                      {restocking && <Loader2 className="w-3 h-3 animate-spin" />}
                      追加
                    </button>
                  </form>
                  <button
                    type="button"
                    disabled={restocking}
                    onClick={() => setRestockOpen(false)}
                    className="text-xs text-gray-500 hover:text-gray-700 disabled:opacity-50"
                  >
                    閉じる
                  </button>
                  {restockError && (
                    <span className="w-full text-xs text-red-600">{restockError}</span>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <label className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={Boolean(item.is_active)}
              disabled={isPending}
              className="w-4 h-4 text-orange-500 focus:ring-orange-500 border-gray-300 disabled:opacity-50"
              onChange={(e) => {
                const next = e.currentTarget.checked;
                startTransition(async () => {
                  await toggleGachaItemStatus(item.id, next);
                  router.refresh();
                });
              }}
            />
            ガチャに入れる
          </label>

          <Link
            href={`/dashboard/gacha/${item.id}`}
            className="p-2 text-gray-500 hover:text-blue-700 hover:bg-gray-50 transition-colors"
            aria-label="編集"
          >
            <Pencil className="w-4 h-4" />
          </Link>

          <DeleteButton id={item.id} name={item.name} shopName={shopName} />
        </div>
      </div>
    </div>
  );
}
