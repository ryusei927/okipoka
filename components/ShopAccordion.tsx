"use client";

import { useState } from "react";
import { MapPin, Clock, Globe, Instagram, Navigation, Store, CalendarDays, JapaneseYen, ChevronDown, Copy, Check, Phone } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { format } from "date-fns";
import { ja } from "date-fns/locale";

const XIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

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
          <div key={shop.id} id={`shop-${shop.id}`} className="bg-white border border-gray-100 overflow-hidden transition-shadow hover:shadow-sm">
            {/* ヘッダー */}
            <div
              onClick={alwaysOpen ? undefined : () => toggle(shop.id)}
              className={`w-full flex items-center gap-3.5 p-3.5 text-left ${alwaysOpen ? "" : "cursor-pointer"}`}
            >
              {/* ロゴ */}
              <div className="shrink-0 w-14 h-14 bg-gray-50 overflow-hidden relative flex items-center justify-center border border-gray-100">
                {shop.image_url ? (
                  <Image
                    src={shop.image_url}
                    alt={shop.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <Store className="w-7 h-7 text-gray-300" />
                )}
              </div>

              {/* 情報 */}
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-gray-900 truncate">
                  {shop.name}
                </h3>
                <div className="flex items-center gap-3 mt-1 text-[11px] text-gray-400">
                  {shop.opening_hours && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 shrink-0" />
                      {shop.opening_hours}
                    </span>
                  )}
                  {shop.tournaments.length > 0 && (
                    <span className="flex items-center gap-1 text-orange-500 font-bold">
                      <CalendarDays className="w-3 h-3" />
                      {shop.tournaments.length}件
                    </span>
                  )}
                </div>
              </div>

              {/* 開閉アイコン */}
              {!alwaysOpen && (
                <ChevronDown className={`w-5 h-5 text-gray-300 shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
              )}
            </div>

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
                      <MapPin className="w-3.5 h-3.5 text-red-400 shrink-0" />
                      <p className="text-xs text-gray-600 flex-1 min-w-0">{shop.address}</p>
                      <button
                        onClick={() => copyAddress(shop.id, shop.address!)}
                        className="shrink-0 p-1.5 hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-all"
                        title="住所をコピー"
                      >
                        {copiedId === shop.id ? (
                          <Check className="w-3.5 h-3.5 text-green-500" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  )}
                  {shop.opening_hours && (
                    <div className="flex items-center gap-2.5 px-3.5 py-3">
                      <Clock className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                      <p className="text-xs text-gray-600">{shop.opening_hours}</p>
                    </div>
                  )}
                  {shop.phone && (
                    <div className="flex items-center gap-2.5 px-3.5 py-3">
                      <Phone className="w-3.5 h-3.5 text-green-500 shrink-0" />
                      <a href={`tel:${shop.phone}`} className="text-xs text-gray-600 hover:text-green-600 transition-colors">{shop.phone}</a>
                    </div>
                  )}
                </div>

                {/* SNSリンク */}
                {hasLinks && (
                  <div className="flex items-center gap-2">
                    {shop.instagram_url && (
                      <a
                        href={shop.instagram_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center w-9 h-9 rounded-full bg-pink-50 text-pink-500 hover:bg-pink-100 transition-all"
                      >
                        <Instagram className="w-4 h-4" />
                      </a>
                    )}
                    {shop.twitter_url && (
                      <a
                        href={shop.twitter_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center w-9 h-9 rounded-full bg-gray-900 text-white hover:bg-black transition-all"
                      >
                        <XIcon className="w-4 h-4" />
                      </a>
                    )}
                    {shop.google_map_url && (
                      <a
                        href={shop.google_map_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center w-9 h-9 rounded-full bg-red-50 text-red-500 hover:bg-red-100 transition-all"
                      >
                        <Navigation className="w-4 h-4" />
                      </a>
                    )}
                    {shop.website_url && (
                      <a
                        href={shop.website_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center w-9 h-9 rounded-full bg-blue-50 text-blue-500 hover:bg-blue-100 transition-all"
                      >
                        <Globe className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                )}

                {/* トーナメント */}
                {shop.tournaments.length > 0 && (
                  <div className="bg-gray-50/50 overflow-hidden">
                    <div className="px-3.5 py-2.5 flex items-center gap-2">
                      <CalendarDays className="w-3.5 h-3.5 text-orange-500" />
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
                                <span className="text-[10px] text-gray-400 shrink-0 flex items-center gap-0.5">
                                  <JapaneseYen className="w-2.5 h-2.5" />
                                  {tournament.buy_in}
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
