import { Download, Ban, Ticket } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { GenerateCodesForm } from "./GenerateCodesForm";
import { voidBatch } from "./actions";

export const dynamic = "force-dynamic";

type CodeRow = {
  batch_label: string | null;
  duration_months: number;
  face_value_yen: number | null;
  status: string;
  expires_at: string;
  created_at: string;
};

type BatchSummary = {
  label: string;
  durationMonths: number;
  faceValueYen: number | null;
  expiresAt: string;
  createdAt: string;
  total: number;
  unused: number;
  redeemed: number;
  voided: number;
};

export default async function PremiumCodesPage() {
  const admin = createAdminClient();
  const { data: codes } = await admin
    .from("premium_codes")
    .select("batch_label, duration_months, face_value_yen, status, expires_at, created_at")
    .order("created_at", { ascending: false });

  const batches = new Map<string, BatchSummary>();
  for (const row of (codes ?? []) as CodeRow[]) {
    const label = row.batch_label ?? "(ロットなし)";
    let batch = batches.get(label);
    if (!batch) {
      batch = {
        label,
        durationMonths: row.duration_months,
        faceValueYen: row.face_value_yen,
        expiresAt: row.expires_at,
        createdAt: row.created_at,
        total: 0,
        unused: 0,
        redeemed: 0,
        voided: 0,
      };
      batches.set(label, batch);
    }
    batch.total++;
    if (row.status === "unused") batch.unused++;
    else if (row.status === "redeemed") batch.redeemed++;
    else if (row.status === "void") batch.voided++;
  }

  const batchList = Array.from(batches.values());
  const totalRedeemed = batchList.reduce((sum, b) => sum + b.redeemed, 0);
  const totalUnused = batchList.reduce((sum, b) => sum + b.unused, 0);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">プレミアムカード</h1>
        <p className="mt-1 text-sm text-gray-500">
          店頭販売用のプレミアムコードを発行・管理します
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <StatCard label="発行済み" value={(codes ?? []).length} />
        <StatCard label="使用済み" value={totalRedeemed} highlight />
        <StatCard label="未使用" value={totalUnused} />
      </div>

      <GenerateCodesForm />

      <section>
        <h2 className="mb-3 text-base font-bold text-gray-900">発行ロット一覧</h2>
        {batchList.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-10 text-center text-sm text-gray-400">
            <Ticket className="mx-auto mb-2 h-6 w-6" />
            まだコードが発行されていません
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-gray-100 bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-xs text-gray-400">
                  <th className="px-4 py-3 font-semibold">ロット</th>
                  <th className="px-4 py-3 font-semibold">期間</th>
                  <th className="px-4 py-3 font-semibold">額面</th>
                  <th className="px-4 py-3 font-semibold">登録期限</th>
                  <th className="px-4 py-3 text-right font-semibold">使用/発行</th>
                  <th className="px-4 py-3 text-right font-semibold">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {batchList.map((batch) => (
                  <tr key={batch.label} className="hover:bg-gray-50/50">
                    <td className="px-4 py-3 font-medium text-gray-900">{batch.label}</td>
                    <td className="px-4 py-3 text-gray-600">{batch.durationMonths}ヶ月</td>
                    <td className="px-4 py-3 text-gray-600">
                      {batch.faceValueYen ? `${batch.faceValueYen.toLocaleString()}円` : "-"}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{batch.expiresAt}</td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      <span className="font-bold text-orange-600">{batch.redeemed}</span>
                      <span className="text-gray-400"> / {batch.total}</span>
                      {batch.voided > 0 && (
                        <span className="ml-1 text-xs text-gray-400">(無効{batch.voided})</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <a
                          href={`/api/admin/premium-codes/csv?batch=${encodeURIComponent(batch.label)}`}
                          className="inline-flex items-center gap-1 rounded-lg bg-gray-100 px-2.5 py-1.5 text-xs font-semibold text-gray-700 transition-colors hover:bg-gray-200"
                        >
                          <Download className="h-3.5 w-3.5" />
                          CSV
                        </a>
                        {batch.unused > 0 && (
                          <form action={voidBatch}>
                            <input type="hidden" name="batchLabel" value={batch.label} />
                            <button
                              type="submit"
                              className="inline-flex items-center gap-1 rounded-lg bg-red-50 px-2.5 py-1.5 text-xs font-semibold text-red-600 transition-colors hover:bg-red-100"
                              title="このロットの未使用コードをすべて無効化します（カード紛失・盗難時用）"
                            >
                              <Ban className="h-3.5 w-3.5" />
                              無効化
                            </button>
                          </form>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <p className="text-xs leading-5 text-gray-400">
        運用メモ: コードは英数字12桁（紛らわしい文字を除外済み）。CSVの「コード」列を
        カード印字用に使ってください。登録期限は資金決済法（前払式支払手段）の適用除外を
        維持するため、発行から6ヶ月以内に設定されます。
      </p>
    </div>
  );
}

function StatCard({
  label,
  value,
  highlight,
}: {
  label: string;
  value: number;
  highlight?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
      <p className="text-xs font-medium text-gray-400">{label}</p>
      <p className={`mt-1 text-2xl font-bold tabular-nums ${highlight ? "text-orange-600" : "text-gray-900"}`}>
        {value.toLocaleString()}
      </p>
    </div>
  );
}
