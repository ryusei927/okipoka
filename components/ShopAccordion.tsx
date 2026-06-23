"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { format } from "date-fns";
import { ja } from "date-fns/locale";

type Tournament = {
  id: string;
  title: string;
  start_at: string;
  buy_in?: string | null;
};

type Shop = {
  id: string;
  name: string;
  slug?: string | null;
  image_url?: string | null;
  photo_url?: string | null;
  description?: string | null;
  address?: string | null;
  phone?: string | null;
  opening_hours?: string | null;
  google_map_url?: string | null;
  area?: string | null;
  instagram_url?: string | null;
  twitter_url?: string | null;
  website_url?: string | null;
};

type ShopWithTournaments = Shop & {
  tournaments: Tournament[];
};

export default function ShopAccordion({ shops, alwaysOpen = false }: { shops: ShopWithTournaments[]; alwaysOpen?: boolean }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const toggle = (id: string) => {
    setOpenId((prev) => (prev === id ? null : id));
  };

  const copyAddress = (shopId: string, address: string) => {
    navigator.clipboard.writeText(address);
    setCopiedId(shopId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-2.5">
      {shops.map((shop) => {
        const isOpen = alwaysOpen || openId === shop.id;
        const hasLinks = shop.instagram_url || shop.twitter_url || shop.google_map_url || shop.website_url;

        // 日付ごとにトーナメントをグループ化
        const tournamentsByDate = shop.tournaments.reduce((acc, t) => {
          const dateKey = format(new Date(t.start_at), "yyyy-MM-dd");
          if (!acc[dateKey]) acc[dateKey] = [];
          acc[dateKey].push(t);
          return acc;
        }, {} as Record<string, Tournament[]>);

        return (
          <div key={shop.id} id={`shop-${shop.id}`} className="bg-white border border-gray-200 rounded-sm overflow-hidden transition-all hover:shadow-md hover:border-gray-300">
            {/* ヘッダー */}
            <div
              onClick={alwaysOpen ? undefined : () => toggle(shop.id)}
              className={`w-full flex items-center gap-3.5 p-3 text-left ${alwaysOpen ? "" : "cursor-pointer"}`}
            >
              {/* ロゴ */}
              <div className="shrink-0 w-16 h-16 rounded-sm bg-gray-50 overflow-hidden relative flex items-center justify-center border border-gray-100">
                {shop.image_url ? (
                  <Image
                    src={shop.image_url}
                    alt={shop.name}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                ) : (
                  <span className="text-xs font-bold text-gray-400">{shop.name.slice(0, 2)}</span>
                )}
              </div>

              {/* 情報 */}
              <div className="flex-1 min-w-0">
                <h3 className="text-[15px] font-bold text-gray-900 truncate leading-tight">
                  {shop.name}
                </h3>

                {/* バッジ行 */}
                <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                  {shop.area && (
                    <span className="inline-flex px-2 py-0.5 rounded-sm bg-gray-100 text-[11px] font-medium text-gray-600">
                      {shop.area}
                    </span>
                  )}
                  {shop.tournaments.length > 0 ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm bg-green-50 text-[11px] font-bold text-green-600">
                      <span className="w-1.5 h-1.5 rounded-sm bg-green-500" />
                      開催予定 {shop.tournaments.length}件
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm bg-gray-50 text-[11px] font-medium text-gray-400">
                      開催予定なし
                    </span>
                  )}
                </div>

                {/* 営業時間 */}
                {shop.opening_hours && (
                  <div className="mt-1 text-[11px] text-gray-400">
                    <span className="truncate">{shop.opening_hours}</span>
                  </div>
                )}
              </div>

            </div>

            {/* メタ情報行 */}
            {!alwaysOpen && (
              <div className="grid grid-cols-4 border-t border-gray-100 divide-x divide-gray-100 bg-gray-50/40">
                {/* 開催予定 */}
                <div className="flex flex-col justify-center px-3 py-2">
                  <span className="text-[10px] text-gray-400 leading-none">開催予定</span>
                  <span className="mt-1 text-xs font-bold text-gray-900 leading-none">{shop.tournaments.length}件</span>
                </div>

                {/* 営業 */}
                <div className="flex flex-col justify-center px-3 py-2">
                  <span className="text-[10px] text-gray-400 leading-none">営業時間</span>
                  <span className="mt-1 text-xs font-bold text-gray-900 leading-none">{shop.opening_hours ? "あり" : "未登録"}</span>
                </div>

                {/* SNS */}
                <div className="flex flex-col justify-center px-3 py-2">
                  <span className="text-[10px] text-gray-400 leading-none">リンク</span>
                  <span className="mt-1 text-xs font-bold text-gray-900 leading-none">{hasLinks ? "あり" : "なし"}</span>
                </div>

                {/* 詳細トグル */}
                <button
                  onClick={() => toggle(shop.id)}
                  className="flex flex-col justify-center px-3 py-2 text-left hover:bg-orange-50 transition-colors"
                >
                  <span className="text-[10px] text-gray-400 leading-none">詳細</span>
                  <span className="mt-1 text-xs font-bold text-orange-600 leading-none">
                    {isOpen ? "閉じる" : "見る"}
                  </span>
                </button>
              </div>
            )}

            {/* 展開部分 */}
            <div
              className={alwaysOpen ? "" : "overflow-hidden transition-all duration-300 ease-in-out"}
              style={alwaysOpen ? undefined : {
                maxHeight: isOpen ? "1200px" : "0",
                opacity: isOpen ? 1 : 0,
              }}
            >
              <div className="px-4 pb-4 space-y-3 border-t border-gray-50 pt-3">

                {/* 店舗写真 */}
                {shop.photo_url && (
                  <div className="overflow-hidden relative aspect-video">
                    <Image
                      src={shop.photo_url}
                      alt={`${shop.name}の写真`}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}

                {/* 紹介文 */}
                {shop.description && (
                  <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">{shop.description}</p>
                )}

                {/* 店舗情報 */}
                <div className="space-y-0 divide-y divide-gray-50 bg-gray-50/50 overflow-hidden">
                  {shop.address && (
                    <div className="flex items-center gap-2.5 px-3.5 py-3">
                      <span className="w-12 shrink-0 text-[10px] font-bold text-gray-400">住所</span>
                      <p className="text-xs text-gray-600 flex-1 min-w-0">{shop.address}</p>
                      <button
                        onClick={() => copyAddress(shop.id, shop.address!)}
                        className="shrink-0 px-2 py-1 text-[10px] font-bold text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-all"
                        title="住所をコピー"
                      >
                        {copiedId === shop.id ? "コピー済み" : "コピー"}
                      </button>
                    </div>
                  )}
                  {shop.opening_hours && (
                    <div className="flex items-center gap-2.5 px-3.5 py-3">
                      <span className="w-12 shrink-0 text-[10px] font-bold text-gray-400">営業時間</span>
                      <p className="text-xs text-gray-600">{shop.opening_hours}</p>
                    </div>
                  )}
                  {shop.phone && (
                    <div className="flex items-center gap-2.5 px-3.5 py-3">
                      <span className="w-12 shrink-0 text-[10px] font-bold text-gray-400">電話</span>
                      <a href={`tel:${shop.phone}`} className="text-xs text-gray-600 hover:text-green-600 transition-colors">{shop.phone}</a>
                    </div>
                  )}
                </div>

                {/* SNSリンク */}
                {hasLinks && (
                  <div className="flex flex-wrap items-center gap-2">
                    {shop.instagram_url && (
                      <a
                        href={shop.instagram_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-2 text-xs font-bold text-gray-700 bg-gray-50 hover:bg-gray-100 transition-all"
                      >
                        Instagram
                      </a>
                    )}
                    {shop.twitter_url && (
                      <a
                        href={shop.twitter_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-2 text-xs font-bold text-gray-700 bg-gray-50 hover:bg-gray-100 transition-all"
                      >
                        X
                      </a>
                    )}
                    {shop.google_map_url && (
                      <a
                        href={shop.google_map_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-2 text-xs font-bold text-gray-700 bg-gray-50 hover:bg-gray-100 transition-all"
                      >
                        Google Map
                      </a>
                    )}
                    {shop.website_url && (
                      <a
                        href={shop.website_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-2 text-xs font-bold text-gray-700 bg-gray-50 hover:bg-gray-100 transition-all"
                      >
                        Web
                      </a>
                    )}
                  </div>
                )}

                {/* トーナメント */}
                {shop.tournaments.length > 0 && (
                  <div className="bg-gray-50/50 overflow-hidden">
                    <div className="px-3.5 py-2.5">
                      <span className="text-xs font-black text-gray-700">開催予定トーナメント</span>
                    </div>
                    <div className="border-t border-gray-100/60">
                      {Object.entries(tournamentsByDate).map(([dateKey, dateTournaments]) => (
                        <div key={dateKey}>
                          <div className="px-3.5 py-1.5 bg-gray-100/50">
                            <span className="text-[10px] font-bold text-gray-400">
                              {format(new Date(dateKey), "M/d（E）", { locale: ja })}
                            </span>
                          </div>
                          {dateTournaments.map((tournament) => (
                            <Link
                              key={tournament.id}
                              href={`/tournaments/${tournament.id}`}
                              className="flex items-center gap-2.5 px-3.5 py-2 hover:bg-gray-50 transition-colors group"
                            >
                              <span className="shrink-0 text-xs font-bold text-orange-500 w-10 text-right">
                                {format(new Date(tournament.start_at), "HH:mm")}
                              </span>
                              <span className="text-xs font-medium text-gray-700 truncate group-hover:text-orange-600 transition-colors flex-1">
                                {tournament.title}
                              </span>
                              {tournament.buy_in && tournament.buy_in !== "-" && (
                                <span className="text-[10px] text-gray-400 shrink-0">
                                  ¥{tournament.buy_in}
                                </span>
                              )}
                            </Link>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Google Map ボタン削除済み—SNSアイコンのナビゲーションボタンで対応 */}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
