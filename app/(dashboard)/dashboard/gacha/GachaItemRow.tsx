"use client";

import Link from "next/link";
import { Pencil } from "lucide-react";
import { useTransition } from "react";
import { DeleteButton } from "./DeleteButton";
import { toggleGachaItemStatus } from "./actions";
import { useRouter } from "next/navigation";

function typeLabel(type?: string | null) {
  switch (type) {
    case "drink_ticket":
      return "ドリンク";
    case "discount_coupon":
      return "割引";
    case "other":
      return "その他";
    case "none":
      return "ハズレ";
    default:
      return type || "-";
  }
}

export function GachaItemRow({ item }: { item: any }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="font-bold text-gray-900 truncate">{item.name}</div>
            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-gray-100 text-gray-700">
              {typeLabel(item.type)}
            </span>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                item.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
              }`}
            >
              {item.is_active ? "有効" : "無効"}
            </span>
          </div>

          {item.description && (
            <div className="text-sm text-gray-600 mt-1">{item.description}</div>
          )}

          <div className="text-xs text-gray-500 mt-2 flex flex-wrap gap-x-4 gap-y-1">
            <span>重み: {item.probability}</span>
            <span>value: {typeof item.value === "number" ? item.value : "-"}</span>
            {typeof item.stock_total === "number" ? (
              <span className={item.stock_used >= item.stock_total ? "text-red-600 font-bold" : ""}>
                残り: {Math.max(0, item.stock_total - (item.stock_used || 0))} / {item.stock_total}
              </span>
            ) : (
              <span className="text-blue-600 font-medium">在庫: 無制限</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={Boolean(item.is_active)}
              disabled={isPending}
              className="w-4 h-4 text-orange-500 rounded focus:ring-orange-500 border-gray-300 disabled:opacity-50"
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
            className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-full transition-colors"
            aria-label="編集"
          >
            <Pencil className="w-4 h-4" />
          </Link>

          <DeleteButton id={item.id} />
        </div>
      </div>
    </div>
  );
}
