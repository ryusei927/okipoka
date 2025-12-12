import { createClient } from "@/lib/supabase/server";
import { MapPin, Clock, Globe, Instagram, Twitter, ExternalLink, Store } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";

export default async function ShopDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: shop } = await supabase
    .from("shops")
    .select("*")
    .eq("id", id)
    .single();

  if (!shop) {
    notFound();
  }

  // 店舗の大会情報も取得
  const { data: tournaments } = await supabase
    .from("tournaments")
    .select("*")
    .eq("shop_id", id)
    .gte("start_at", new Date().toISOString()) // 未来の大会のみ
    .order("start_at", { ascending: true });

  return (
    <div className="pb-20 bg-gray-50 min-h-screen">
      {/* ヘッダー画像エリア (なければグレー) */}
      <div className="h-48 bg-gray-200 relative">
        {shop.image_url && (
          <div className="absolute inset-0 overflow-hidden">
             <Image
              src={shop.image_url}
              alt={shop.name}
              fill
              className="object-cover opacity-50 blur-sm"
            />
            <div className="absolute inset-0 bg-black/30" />
          </div>
        )}
        
        <div className="absolute -bottom-12 left-1/2 -translate-x-1/2">
          <div className="w-24 h-24 bg-white rounded-2xl shadow-lg p-1">
            <div className="w-full h-full bg-gray-100 rounded-xl overflow-hidden relative flex items-center justify-center">
              {shop.image_url ? (
                <Image
                  src={shop.image_url}
                  alt={shop.name}
                  fill
                  className="object-cover"
                />
              ) : (
                <Store className="w-10 h-10 text-gray-300" />
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="pt-16 px-4 max-w-2xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">{shop.name}</h1>
        </div>

        {/* 店舗情報 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="font-bold text-gray-900 mb-4">店舗情報</h2>
          <dl className="space-y-4">
            <div className="grid grid-cols-[80px_1fr] gap-4">
              <dt className="text-sm text-gray-500 font-medium py-1">店舗名</dt>
              <dd className="text-sm text-gray-900 font-medium py-1">{shop.name}</dd>
            </div>
            
            <div className="grid grid-cols-[80px_1fr] gap-4">
              <dt className="text-sm text-gray-500 font-medium py-1">所在地</dt>
              <dd className="text-sm text-gray-900 font-medium py-1">
                {shop.address || "-"}
              </dd>
            </div>

            <div className="grid grid-cols-[80px_1fr] gap-4">
              <dt className="text-sm text-gray-500 font-medium py-1">営業時間</dt>
              <dd className="text-sm text-gray-900 font-medium py-1">
                {shop.opening_hours || "-"}
              </dd>
            </div>
          </dl>
        </div>

        {/* 関連リンク */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="font-bold text-gray-900 mb-4">関連リンク</h2>
          <div className="grid grid-cols-2 gap-3">
            {shop.instagram_url && (
              <a
                href={shop.instagram_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors text-sm font-bold text-gray-700"
              >
                <Instagram className="w-4 h-4 text-pink-600" />
                Instagram
              </a>
            )}
            {shop.twitter_url && (
              <a
                href={shop.twitter_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors text-sm font-bold text-gray-700"
              >
                <Twitter className="w-4 h-4 text-blue-400" />
                X (Twitter)
              </a>
            )}
            {shop.google_map_url && (
              <a
                href={shop.google_map_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors text-sm font-bold text-gray-700"
              >
                <MapPin className="w-4 h-4 text-red-500" />
                Google Map
              </a>
            )}
            {shop.website_url && (
              <a
                href={shop.website_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors text-sm font-bold text-gray-700"
              >
                <Globe className="w-4 h-4 text-blue-600" />
                公式サイト
              </a>
            )}
          </div>
          {!shop.instagram_url && !shop.twitter_url && !shop.google_map_url && !shop.website_url && (
            <p className="text-sm text-gray-400 text-center py-2">関連リンクはありません</p>
          )}
        </div>

        {/* 開催予定の大会 */}
        {tournaments && tournaments.length > 0 && (
          <div>
            <h2 className="font-bold text-gray-900 mb-4 px-2">開催予定の大会</h2>
            <div className="space-y-3">
              {tournaments.map((tournament) => (
                <div key={tournament.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                  <div className="flex items-center gap-4">
                    <div className="flex flex-col items-center justify-center min-w-16">
                      <span className="text-xl font-bold text-orange-500">
                        {format(new Date(tournament.start_at), "HH:mm")}
                      </span>
                      <span className="text-xs text-gray-400">
                        {format(new Date(tournament.start_at), "MM/dd")}
                      </span>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900">{tournament.title}</h3>
                      <div className="text-sm text-gray-500 mt-1">
                        Buy-in: {tournament.buy_in || "-"}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
