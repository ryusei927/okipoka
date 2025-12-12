"use client";

import { Trash2 } from "lucide-react";
import { deleteAd } from "./actions";

export function DeleteAdButton({ id }: { id: string }) {
  return (
    <form action={deleteAd.bind(null, id)}>
      <button
        type="submit"
        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
        onClick={(e) => {
          if (!confirm("本当に削除しますか？")) {
            e.preventDefault();
          }
        }}
      >
        <Trash2 className="w-5 h-5" />
      </button>
    </form>
  );
}
