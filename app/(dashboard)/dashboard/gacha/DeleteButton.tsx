"use client";

import { Trash2 } from "lucide-react";
import { useTransition } from "react";
import { deleteGachaItem } from "./actions";

export function DeleteButton({
  id,
  name,
  shopName,
}: {
  id: string;
  name?: string;
  shopName?: string | null;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => {
        const label = [
          name ? `景品: ${name}` : null,
          `店舗: ${shopName || "共通（指定なし）"}`,
        ]
          .filter(Boolean)
          .join("\n");
        if (
          !confirm(
            `${label ? `${label}\n\n` : ""}この景品を削除しますか？（ガチャから除外され、過去の当選履歴は保持されます）`
          )
        )
          return;
        startTransition(async () => {
          try {
            await deleteGachaItem(id);
          } catch (e: any) {
            alert(e?.message || "削除に失敗しました");
          }
        });
      }}
      className="p-2 text-gray-500 hover:text-red-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
      aria-label="削除"
    >
      <Trash2 className="w-4 h-4" />
    </button>
  );
}
