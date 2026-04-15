import { createClient } from "@/lib/supabase/server";
import { List } from "lucide-react";
import ShopAccordion from "@/components/ShopAccordion";
import Image from "next/image";
import { AdClickWrapper } from "@/components/ads/AdClickWrapper";
import { AdBanner } from "@/components/ads/AdBanner";
import { AdSquareGrid } from "@/components/ads/AdSquareGrid";

export default async function ShopsPage() {
  const supabase = await createClient();
  
  // 店舗 + 今後のトーナメントを一括取得
  const [{ data: shops }, { data: tournaments }, { data: squareAds }, { data: bannerAds }] = await Promise.all([
    supabase.from("shops").select("*").order("name"),
    supabase
      .from("tournaments")
      .select("id, title, start_at, buy_in, shop_id")
      .gte("start_at", new Date().toISOString())
      .order("start_at", { ascending: true }),
    supabase
      .from("ads")
      .select("*")
      .eq("is_active", true)
      .eq("type", "square")
      .order("priority", { ascending: false }),
    supabase
      .from("ads")
      .select("*")
      .eq("is_active", true)
      .eq("type", "banner")
      .order("priority", { ascending: false })
      .limit(1),
  ]);

  // トーナメントをshop_idごとにマップ
  const tournamentsByShop = (tournaments || []).reduce((acc, t) => {
    if (!t.shop_id) return acc;
    if (!acc[t.shop_id]) acc[t.shop_id] = [];
    acc[t.shop_id]!.push(t);
    return acc;
  }, {} as Record<string, typeof tournaments>);

  // 店舗にトーナメントを紐付け
  const shopsWithTournaments = (shops || []).map((shop) => ({
    ...shop,
    tournaments: tournamentsByShop[shop.id] || [],
  }));

  // エリアごとにグループ化
  const groupedShops = shopsWithTournaments.reduce((acc, shop) => {
    const area = shop.area || "その他";
    if (!acc[area]) acc[area] = [];
    acc[area].push(shop);
    return acc;
  }, {} as Record<string, typeof shopsWithTournaments>);

  const areaOrder = ["那覇", "中部", "南部", "北部", "宮古島", "その他"];

  // エリアごとの番号を計算
  let areaIndex = 0;
  const areaNumbers: Record<string, number> = {};
  for (const area of areaOrder) {
    const areaShops = groupedShops[area];
    if (areaShops && areaShops.length > 0) {
      areaIndex++;
      areaNumbers[area] = areaIndex;
    }
  }

  return (
    <div className="pb-24 pt-6 px-4 bg-white min-h-screen">
      {/* モバイル: バナー広告 */}
      <div className="md:hidden mb-4">
        {bannerAds && bannerAds[0] && <AdBanner ad={bannerAds[0]} />}
      </div>

      {/* ヘッダー */}
      <div className="text-center mb-6 max-w-5xl mx-auto">
        <h1 className="text-xl font-black text-gray-900">沖縄ポーカー店舗ガイド</h1>
        <p className="text-sm text-gray-400 mt-1">全店舗の情報・トーナメント予定を一覧で</p>
      </div>

      {/* PC: サイドバー + コンテンツ / スマホ: 縦並び */}
      <div className="max-w-5xl mx-auto md:flex md:gap-8 md:items-start">

        {/* 目次 — スマホ: 上部 / PC: 左サイドバー固定 */}
        <div className="md:w-64 md:shrink-0 mb-6 md:mb-0">
          <div className="bg-gray-50 border border-gray-100 p-5">
            <div className="flex items-center justify-center md:justify-start gap-2 mb-4">
              <List className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-black text-gray-700">目次</span>
            </div>
            <div className="space-y-3">
              {areaOrder.map((area) => {
                const areaShops = groupedShops[area];
                if (!areaShops || areaShops.length > 0 === false) return null;
                const num = areaNumbers[area];

                return (
                  <div key={area}>
                    <a href={`#area-${area}`} className="text-sm font-bold text-gray-800 hover:text-orange-500 transition-colors">
                      {num} | {area}エリア
                    </a>
                    <div className="ml-6 mt-1 space-y-0.5">
                      {areaShops.map((shop: any) => (
                        <a
                          key={shop.id}
                          href={`#shop-${shop.id}`}
                          className="block text-xs text-gray-500 hover:text-orange-500 transition-colors"
                        >
                          {shop.name}
                        </a>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* PC: 目次の下にスクエア広告（1列で3つ） */}
          {squareAds && squareAds.length > 0 && (
            <div className="hidden md:block mt-6 space-y-3">
              <div className="text-[10px] text-gray-400">広告</div>
              {squareAds.slice(0, 3).map((ad: any) => (
                <AdClickWrapper key={ad.id} ad={ad} className="block group">
                  <div className="relative w-full aspect-square overflow-hidden shadow-sm border border-gray-100 bg-gray-50">
                    <Image
                      src={ad.image_url}
                      alt={ad.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/60 via-black/20 to-transparent pt-8 pb-2 px-2">
                      <p className="text-xs font-bold text-white leading-tight line-clamp-2">{ad.title}</p>
                      {ad.description && (
                        <p className="text-[10px] text-white/70 leading-tight line-clamp-1 mt-0.5">{ad.description}</p>
                      )}
                    </div>
                  </div>
                </AdClickWrapper>
              ))}
            </div>
          )}
        </div>

        {/* コンテンツ — スマホ: フル幅 / PC: 右側に広がる */}
        <div className="md:flex-1 md:min-w-0 space-y-8">
          {areaOrder.map((area, idx) => {
            const areaShops = groupedShops[area];
            if (!areaShops || areaShops.length === 0) return null;

            return (
              <div key={area}>
                {/* 那覇の後にスクエア広告 */}
                {idx === 1 && squareAds && squareAds.length > 0 && (
                  <div className="mb-8">
                    <AdSquareGrid ads={squareAds.slice(0, 2)} />
                  </div>
                )}
                {/* 中部の後にスクエア広告 */}
                {idx === 2 && squareAds && squareAds.length > 0 && (
                  <div className="mb-8">
                    <AdSquareGrid ads={squareAds.slice(0, 2)} />
                  </div>
                )}
                {/* 北部の後（4エリア目の後）にスクエア広告 */}
                {idx === 4 && squareAds && squareAds.length > 2 && (
                  <div className="mb-8">
                    <AdSquareGrid ads={squareAds.slice(2, 4)} />
                  </div>
                )}
                <div id={`area-${area}`}>
                  <div className="flex items-center gap-2 mb-3 px-1">
                    <div className="w-1 h-5 bg-orange-500" />
                    <h2 className="text-sm font-black text-gray-900">{area}</h2>
                    <span className="text-xs text-gray-400 font-bold">{areaShops.length}店舗</span>
                  </div>
                  <ShopAccordion shops={areaShops} alwaysOpen />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
