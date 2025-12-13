"use client";

import { Trash2 } from "lucide-react";
import { useTransition } from "react";
import { deleteGachaItem } from "./actions";

export function DeleteButton({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => {
        if (!confirm("この景品を削除しますか？（ガチャから除外され、過去の当選履歴は保持されます）")) return;
        startTransition(async () => {
          try {
            await deleteGachaItem(id);
          } catch (e: any) {
            alert(e?.message || "削除に失敗しました");
          }
        });
      }}
      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors disabled:opacity-50"
      aria-label="削除"
    >
      <Trash2 className="w-4 h-4" />
    </button>
  );
}
