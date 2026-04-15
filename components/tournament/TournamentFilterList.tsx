"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { Search, X, SlidersHorizontal, ChevronLeft, ChevronRight, CalendarDays, MapPin, Store } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { TournamentCard } from "./TournamentCard";
import { AdBanner } from "@/components/ads/AdBanner";
import type { Ad } from "@/components/ads/AdBanner";

interface Tournament {
  id: string;
  title: string;
  start_at: string;
  late_reg_at?: string | null;
  buy_in?: string | null;
  tags?: string[] | null;
  shops?: {
    name: string;
    plan?: string | null;
    image_url?: string | null;
    area?: string | null;
  } | null;
}

interface Shop {
  id: string;
  name: string;
  area: string | null;
  image_url: string | null;
}

interface Props {
  tournaments: Tournament[];
  allShops: Shop[];
  dateStr: string;
  prevDateStr: string;
  nextDateStr: string;
  infeedAd?: Ad | null;
}

const ALL_AREAS = ["那覇", "中部", "南部", "北部", "宮古島"];

export function TournamentFilterList({ tournaments, allShops, dateStr, prevDateStr, nextDateStr, infeedAd }: Props) {
  const router = useRouter();
  const [selectedArea, setSelectedArea] = useState<string | null>(null);
  const [selectedShop, setSelectedShop] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const d = new Date(dateStr + "T00:00:00");
    return { year: d.getFullYear(), month: d.getMonth() };
  });
  const searchInputRef = useRef<HTMLInputElement>(null);

  // モーダルを開いたときに検索に自動フォーカス
  useEffect(() => {
    if (isModalOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isModalOpen]);

  // エリアフィルター適用後の店舗一覧
  const filteredShops = useMemo(() => {
    if (!selectedArea) return allShops;
    return allShops.filter((s) => s.area === selectedArea);
  }, [allShops, selectedArea]);

  // フィルター適用
  const filtered = useMemo(() => {
    return tournaments.filter((t) => {
      if (selectedArea && t.shops?.area !== selectedArea) return false;
      if (selectedShop && t.shops?.name !== selectedShop) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchTitle = t.title.toLowerCase().includes(q);
        const matchShop = t.shops?.name?.toLowerCase().includes(q);
        const matchTag = t.tags?.some((tag) => tag.toLowerCase().includes(q));
        if (!matchTitle && !matchShop && !matchTag) return false;
      }
      return true;
    });
  }, [tournaments, selectedArea, selectedShop, searchQuery]);

  const clearFilters = () => {
    setSelectedArea(null);
    setSelectedShop(null);
    setSearchQuery("");
  };

  const hasFilter = selectedArea || selectedShop || searchQuery;

  // フィルター選択したらすぐ結果が見えるよう閉じる
  const applyAndClose = () => setIsModalOpen(false);

  // 日付表示用フォーマット ("04.10")
  const displayMonth = useMemo(() => {
    const d = new Date(dateStr + "T00:00:00");
    return String(d.getMonth() + 1);
  }, [dateStr]);

  const displayDay = useMemo(() => {
    const d = new Date(dateStr + "T00:00:00");
    return String(d.getDate());
  }, [dateStr]);

  // モーダルカレンダー用のフォーマット
  const displayDate = useMemo(() => {
    return `${displayMonth.padStart(2, "0")}.${displayDay.padStart(2, "0")}`;
  }, [displayMonth, displayDay]);

  // 曜日
  const dayOfWeek = useMemo(() => {
    const d = new Date(dateStr + "T00:00:00");
    return ["日", "月", "火", "水", "木", "金", "土"][d.getDay()];
  }, [dateStr]);

  const navigateDate = (dateParam: string) => {
    router.push(`/?date=${dateParam}`);
  };

  // カレンダー用データ
  const calendarDays = useMemo(() => {
    const { year, month } = calendarMonth;
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);
    return days;
  }, [calendarMonth]);

  const calendarMonthLabel = `${calendarMonth.year}年${calendarMonth.month + 1}月`;

  const prevMonth = () => {
    setCalendarMonth((prev) => {
      const m = prev.month - 1;
      return m < 0 ? { year: prev.year - 1, month: 11 } : { year: prev.year, month: m };
    });
  };
  const nextMonth = () => {
    setCalendarMonth((prev) => {
      const m = prev.month + 1;
      return m > 11 ? { year: prev.year + 1, month: 0 } : { year: prev.year, month: m };
    });
  };

  const selectCalendarDate = (day: number) => {
    const { year, month } = calendarMonth;
    const m = String(month + 1).padStart(2, "0");
    const d = String(day).padStart(2, "0");
    navigateDate(`${year}-${m}-${d}`);
    setIsModalOpen(false);
  };

  const currentDateObj = useMemo(() => new Date(dateStr + "T00:00:00"), [dateStr]);

  // 今日の日付文字列
  const todayStr = useMemo(() => {
    const now = new Date();
    const jst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
    const y = jst.getUTCFullYear();
    const m = String(jst.getUTCMonth() + 1).padStart(2, "0");
    const d = String(jst.getUTCDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }, []);

  const isToday = dateStr === todayStr;

  const goToToday = () => {
    navigateDate(todayStr);
    setIsModalOpen(false);
  };

  return (
    <div>
      {/* 日付 + 検索バー + フィルターボタン */}
      <div className="max-w-md md:max-w-none mx-auto px-4 py-3 flex items-center gap-2">
        {/* カレンダー風日付表示 */}
        <div className="shrink-0 w-11 h-11 flex flex-col items-center justify-center rounded-lg border border-gray-200 bg-white shadow-sm">
          <span className="text-[9px] font-bold text-orange-500 leading-none">{dayOfWeek}</span>
          <span className="text-base font-bold text-gray-800 leading-tight">{displayDay}</span>
          <span className="text-[8px] text-gray-400 leading-none">{displayMonth}月</span>
        </div>

        {/* テキスト検索 */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="トーナメントを探す"
            className="w-full pl-9 pr-8 py-2.5 text-sm bg-gray-100 rounded-full border border-gray-200 focus:border-orange-400 focus:outline-none transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-gray-200 transition-colors"
            >
              <X className="w-3.5 h-3.5 text-gray-400" />
            </button>
          )}
        </div>

        {/* フィルターボタン */}
        <button
          onClick={() => setIsModalOpen(true)}
          className={`shrink-0 flex items-center justify-center w-10 h-10 rounded-full border transition-colors ${
            selectedArea || selectedShop
              ? "bg-orange-500 border-orange-500 text-white"
              : "bg-gray-100 border-gray-200 text-gray-400 hover:border-orange-300"
          }`}
        >
          <SlidersHorizontal className="w-4 h-4" />
        </button>
      </div>

      {/* アクティブフィルター表示 */}
      {(selectedArea || selectedShop) && (
        <div className="max-w-md md:max-w-none mx-auto px-4 pb-2 flex items-center gap-2">
          {selectedArea && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-medium bg-orange-50 text-orange-600 rounded-full">
              {selectedArea}
              <button onClick={() => { setSelectedArea(null); setSelectedShop(null); }}>
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {selectedShop && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-medium bg-gray-100 text-gray-700 rounded-full">
              {selectedShop}
              <button onClick={() => setSelectedShop(null)}>
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          <button
            onClick={clearFilters}
            className="text-[11px] text-gray-400 hover:text-orange-500 transition-colors ml-auto"
          >
            すべて解除
          </button>
        </div>
      )}

      {/* フィルターモーダル */}
      {isModalOpen && (
        <div className="fixed inset-0 z-100 flex items-end sm:items-center justify-center">
          {/* オーバーレイ */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setIsModalOpen(false)}
          />

          {/* モーダル本体 */}
          <div className="relative w-full max-w-md bg-white rounded-t-xl sm:rounded-xl p-5 pb-8 sm:pb-5 animate-in slide-in-from-bottom duration-200">
            {/* ヘッダー */}
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-bold text-gray-900">絞り込み</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-full hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {/* 日付 */}
            <div className="mb-4">
              <p className="text-xs font-bold text-gray-500 mb-2 flex items-center gap-1"><CalendarDays className="w-3.5 h-3.5" />日付</p>
              <button
                onClick={() => setIsCalendarOpen(!isCalendarOpen)}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border transition-colors ${
                  isCalendarOpen
                    ? "border-orange-400 bg-orange-50"
                    : "border-gray-200 hover:border-orange-300"
                }`}
              >
                <span className="text-base font-bold text-gray-800 tabular-nums">{displayDate}</span>
                <span className="text-xs text-gray-400">({dayOfWeek})</span>
                <ChevronRight className={`w-3.5 h-3.5 text-gray-400 transition-transform ${isCalendarOpen ? "rotate-90" : ""}`} />
              </button>

              {/* カレンダー */}
              {isCalendarOpen && (
                <div className="mt-3 p-3 bg-gray-50 rounded-xl">
                  {/* 月ナビ */}
                  <div className="flex items-center justify-between mb-2">
                    <button onClick={prevMonth} className="p-1 rounded-full hover:bg-gray-200 transition-colors">
                      <ChevronLeft className="w-4 h-4 text-gray-500" />
                    </button>
                    <span className="text-sm font-bold text-gray-700">{calendarMonthLabel}</span>
                    <button onClick={nextMonth} className="p-1 rounded-full hover:bg-gray-200 transition-colors">
                      <ChevronRight className="w-4 h-4 text-gray-500" />
                    </button>
                  </div>
                  {/* 今日ボタン */}
                  {!isToday && (
                    <div className="flex justify-end mb-1">
                      <button
                        onClick={goToToday}
                        className="text-[11px] font-bold text-orange-500 hover:text-orange-600 transition-colors"
                      >
                        ← 今日
                      </button>
                    </div>
                  )}
                  {/* 曜日ヘッダー */}
                  <div className="grid grid-cols-7 text-center text-[10px] font-medium text-gray-400 mb-1">
                    {["日", "月", "火", "水", "木", "金", "土"].map((d) => (
                      <span key={d}>{d}</span>
                    ))}
                  </div>
                  {/* 日付グリッド */}
                  <div className="grid grid-cols-7 gap-0.5">
                    {calendarDays.map((day, i) => {
                      if (day === null) return <span key={`e-${i}`} />;
                      const isSelected =
                        calendarMonth.year === currentDateObj.getFullYear() &&
                        calendarMonth.month === currentDateObj.getMonth() &&
                        day === currentDateObj.getDate();
                      const isToday = (() => {
                        const now = new Date();
                        return calendarMonth.year === now.getFullYear() && calendarMonth.month === now.getMonth() && day === now.getDate();
                      })();
                      return (
                        <button
                          key={day}
                          onClick={() => selectCalendarDate(day)}
                          className={`h-8 rounded-lg text-xs font-medium transition-colors ${
                            isSelected
                              ? "bg-orange-500 text-white"
                              : isToday
                                ? "bg-orange-100 text-orange-600 hover:bg-orange-200"
                                : "text-gray-700 hover:bg-gray-200"
                          }`}
                        >
                          {day}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* エリア */}
            <div className="mb-4">
              <p className="text-xs font-bold text-gray-500 mb-2 flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />エリア</p>
              <div className="flex flex-wrap gap-2">
                {ALL_AREAS.map((area) => (
                  <button
                    key={area}
                    onClick={() => {
                      setSelectedArea(selectedArea === area ? null : area);
                      setSelectedShop(null);
                    }}
                    className={`px-4 py-1.5 text-sm font-medium rounded-full border transition-colors ${
                      selectedArea === area
                        ? "bg-orange-500 text-white border-orange-500"
                        : "bg-white text-gray-600 border-gray-200 hover:border-orange-300"
                    }`}
                  >
                    {area}
                  </button>
                ))}
              </div>
            </div>

            {/* 店舗 */}
            {filteredShops.length > 0 && (
              <div className="mb-6">
                <p className="text-xs font-bold text-gray-500 mb-2 flex items-center gap-1"><Store className="w-3.5 h-3.5" />店舗</p>
                <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto">
                  {filteredShops.map((shop) => (
                    <button
                      key={shop.id}
                      onClick={() => setSelectedShop(selectedShop === shop.name ? null : shop.name)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-full border transition-colors ${
                        selectedShop === shop.name
                          ? "bg-gray-800 text-white border-gray-800"
                          : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
                      }`}
                    >
                      {shop.image_url && (
                        <Image
                          src={shop.image_url}
                          alt=""
                          width={18}
                          height={18}
                          className="rounded-full object-cover w-4.5 h-4.5"
                        />
                      )}
                      {shop.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* アクションボタン */}
            <div className="flex gap-3">
              <button
                onClick={clearFilters}
                className="flex-1 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
              >
                リセット
              </button>
              <button
                onClick={applyAndClose}
                className="flex-1 py-2.5 text-sm font-bold text-white bg-orange-500 rounded-full hover:bg-orange-600 transition-colors"
              >
                {filtered.length}件を表示
              </button>
            </div>
          </div>
        </div>
      )}

      {/* トーナメントリスト */}
      <div className="max-w-md md:max-w-none mx-auto">
        {filtered.length > 0 ? (
          <div className="border-t border-gray-100">
            {filtered.map((tournament, index) => (
              <div key={tournament.id}>
                {/* ② 5件目の後にインフィード広告を差し込み */}
                {index === 5 && infeedAd && (
                  <div className="border-b border-gray-100">
                    <AdBanner ad={infeedAd} />
                  </div>
                )}
                <TournamentCard
                key={tournament.id}
                id={tournament.id}
                title={tournament.title}
                startAt={tournament.start_at}
                lateRegAt={tournament.late_reg_at}
                shopName={tournament.shops?.name || "Unknown Shop"}
                shopImageUrl={tournament.shops?.image_url}
                buyIn={tournament.buy_in || "-"}
                tags={tournament.tags || []}
                isPremium={tournament.shops?.plan === "premium" || tournament.shops?.plan === "business"}
              />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-10 text-gray-500">
            <p>{hasFilter ? "該当するトーナメントはありません" : "本日のトーナメントはありません"}</p>
          </div>
        )}
      </div>
    </div>
  );
}
