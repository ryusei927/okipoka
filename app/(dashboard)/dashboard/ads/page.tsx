import { createClient } from "@/lib/supabase/server";
import { PlusCircle, ExternalLink, Eye, MousePointerClick } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { DeleteAdButton } from "./DeleteAdButton";

export const dynamic = "force-dynamic";

// 日本時間での「今月1日」を YYYY-MM-DD で返す
function jstMonthStart(): string {
  const jst = new Date(
    new Date().toLocaleString("en-US", { timeZone: "Asia/Tokyo" })
  );
  const y = jst.getFullYear();
  const m = String(jst.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}-01`;
}

export default async function AdsPage() {
  const supabase = await createClient();
  const { data: ads } = await supabase
    .from("ads")
    .select("*")
    .order("priority", { ascending: false });

  // 今月分の表示回数・クリックを日別集計テーブルから合算
  const monthByAdId = new Map<string, { impressions: number; clicks: number }>();
  const adIds = (ads ?? []).map((a) => a.id);
  if (adIds.length > 0) {
    const { data: rows } = await supabase
      .from("ad_metrics")
      .select("ad_id, impressions, clicks")
      .in("ad_id", adIds)
      .gte("day", jstMonthStart());
    for (const row of (rows ?? []) as {
      ad_id: string;
      impressions: number;
      clicks: number;
    }[]) {
      const cur = monthByAdId.get(row.ad_id) ?? { impressions: 0, clicks: 0 };
      cur.impressions += row.impressions ?? 0;
      cur.clicks += row.clicks ?? 0;
      monthByAdId.set(row.ad_id, cur);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">広告管理</h1>
        <Link
          href="/dashboard/ads/new"
          className="flex items-center gap-2 bg-orange-500 text-white px-4 py-2 font-bold hover:bg-orange-600 transition-colors"
        >
          <PlusCircle className="w-5 h-5" />
          新規作成
        </Link>
      </div>

      <div className="grid gap-4">
        {ads?.map((ad) => (
          <div
            key={ad.id}
            className="bg-white p-4 border border-gray-200 flex items-center gap-4"
          >
            <div className="w-24 h-16 relative bg-gray-50 overflow-hidden shrink-0">
              <Image
                src={ad.image_url}
                alt={ad.title}
                fill
                className="object-cover"
              />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-xs px-2 py-0.5 font-bold ${
                  ad.is_active ? "bg-green-50 text-green-700" : "bg-gray-50 text-gray-500"
                }`}>
                  {ad.is_active ? "公開中" : "非公開"}
                </span>
                <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 font-bold">
                  {ad.type === 'banner' ? 'バナー' : 'スクエア'}
                </span>
              </div>
              <h3 className="font-bold text-gray-900 truncate">{ad.title}</h3>
              {ad.link_url && (
                <a 
                  href={ad.link_url} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-xs text-gray-500 flex items-center gap-1 hover:text-orange-500 min-w-0"
                >
                  <ExternalLink className="w-3 h-3 shrink-0" />
                  <span className="truncate flex-1">{ad.link_url}</span>
                </a>
              )}

              {(() => {
                const month = monthByAdId.get(ad.id) ?? { impressions: 0, clicks: 0 };
                const totalImpr = ad.impression_count ?? 0;
                const totalClicks = ad.click_count ?? 0;
                const ctr =
                  month.impressions > 0
                    ? `${((month.clicks / month.impressions) * 100).toFixed(1)}%`
                    : "—";
                return (
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    {/* 今月の実績 */}
                    <div className="inline-flex items-stretch overflow-hidden rounded-md border border-orange-100 bg-orange-50/60">
                      <span className="flex items-center bg-orange-100/70 px-2 text-[10px] font-bold text-orange-700">
                        今月
                      </span>
                      <div className="flex items-center divide-x divide-orange-100">
                        <div className="px-3 py-1 text-center">
                          <div className="flex items-center justify-center gap-1 text-[10px] text-orange-700/70">
                            <Eye className="h-3 w-3" />
                            表示
                          </div>
                          <div className="text-sm font-black leading-tight text-orange-600">
                            {month.impressions.toLocaleString()}
                          </div>
                        </div>
                        <div className="px-3 py-1 text-center">
                          <div className="flex items-center justify-center gap-1 text-[10px] text-gray-500">
                            <MousePointerClick className="h-3 w-3" />
                            クリック
                          </div>
                          <div className="text-sm font-black leading-tight text-gray-800">
                            {month.clicks.toLocaleString()}
                          </div>
                        </div>
                        <div className="px-3 py-1 text-center">
                          <div className="text-[10px] text-gray-500">CTR</div>
                          <div className="text-sm font-black leading-tight text-gray-800">
                            {ctr}
                          </div>
                        </div>
                      </div>
                    </div>
                    {/* 累計 */}
                    <span className="text-[11px] text-gray-400">
                      累計 表示 {totalImpr.toLocaleString()}・クリック{" "}
                      {totalClicks.toLocaleString()}
                    </span>
                  </div>
                );
              })()}
            </div>

            <div className="flex items-center gap-2">
              <Link
                href={`/dashboard/ads/${ad.id}`}
                className="px-3 py-1.5 text-sm font-bold text-gray-700 bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                編集
              </Link>
              <DeleteAdButton id={ad.id} />
            </div>
          </div>
        ))}

        {(!ads || ads.length === 0) && (
          <div className="text-center py-10 text-gray-500">
            広告が登録されていません
          </div>
        )}
      </div>
    </div>
  );
}
