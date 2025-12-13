import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { ArrowLeft, Dices } from "lucide-react";
import { SimulatorClient } from "./simulator-client";

export default async function GachaSimPage() {
  const supabase = await createClient();

  const { data: items, error } = await supabase
    .from("gacha_items")
    .select("*")
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  return (
    <div className="pb-20 space-y-6">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/gacha"
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="戻る"
          >
            <ArrowLeft className="w-6 h-6 text-gray-500" />
          </Link>
          <div className="flex items-center gap-2">
            <Dices className="w-6 h-6 text-gray-400" />
            <h1 className="text-xl font-bold text-gray-900">ガチャシミュレーション</h1>
          </div>
        </div>
      </header>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 text-sm text-gray-700">
        DBには一切保存しません（クーポン付与/履歴/1日1回制限なし）。表示と確率の確認用です。
      </div>

      {error && (
        <div className="bg-white p-4 rounded-xl shadow-sm border border-red-200 text-sm text-red-700">
          gacha_items の取得に失敗しました: {error.message}
        </div>
      )}

      <SimulatorClient items={items || []} />
    </div>
  );
}
