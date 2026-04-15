"use client";

import { Trash2 } from "lucide-react";
import { deleteTournament } from "./actions";

export function DeleteButton({ id }: { id: string }) {
  return (
    <button
      onClick={async () => {
        if (confirm("本当に削除しますか？")) {
          await deleteTournament(id);
        }
      }}
      className="p-2 text-gray-500 hover:text-red-600 hover:bg-gray-50 transition-colors"
    >
      <Trash2 className="w-4 h-4" />
    </button>
  );
}
