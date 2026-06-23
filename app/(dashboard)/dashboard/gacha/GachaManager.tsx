"use client";

import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { GachaItemRow } from "./GachaItemRow";
import { gachaAppearancePct } from "@/lib/gacha";

type Item = Record<string, any>;
type Shop = { id: string; name: string };

const TYPE_LABELS: Record<string, string> = {
  drink_ticket: "ドリンク",
  discount_coupon: "割引",
  ring_chip: "チップ",
  other: "その他",
  none: "ハズレ",
};

function typeLabel(type?: string | null) {
  if (!type) return "-";
  return TYPE_LABELS[type] ?? type;
}

type StatusKind = "active" | "out_of_stock" | "inactive";

function statusOf(item: Item): StatusKind {
  if (!item.is_active) return "inactive";
  const isLimited = typeof item.stock_total === "number";
  if (isLimited && (item.current_stock_used || 0) >= item.stock_total) {
    return "out_of_stock";
  }
  return "active";
}

function remainingOf(item: Item): number {
  if (typeof item.stock_total !== "number") return Number.POSITIVE_INFINITY;
  return Math.max(0, item.stock_total - (item.current_stock_used || 0));
}

export function GachaManager({
  items,
  shops,
  totalWeight,
}: {
  items: Item[];
  shops: Shop[];
  totalWeight: number;
}) {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [shopFilter, setShopFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [grouped, setGrouped] = useState(true);

  const shopNameById = useMemo(
    () => new Map(shops.map((s) => [s.id, s.name])),
    [shops]
  );

  // データに存在する種類だけをフィルタ候補に出す
  const typesPresent = useMemo(() => {
    const set = new Set<string>();
    for (const it of items) if (it.type) set.add(it.type);
    return Array.from(set);
  }, [items]);

  const counts = useMemo(() => {
    let active = 0;
    let out = 0;
    let inactive = 0;
    const kinds = new Set<string>();
    for (const it of items) {
      const s = statusOf(it);
      if (s === "active") active++;
      else if (s === "out_of_stock") out++;
      else inactive++;
      if (it.type) kinds.add(it.type);
    }
    return { active, out, inactive, kinds: kinds.size, total: items.length };
  }, [items]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = items.filter((it) => {
      if (q) {
        const hay = `${it.name ?? ""} ${it.description ?? ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (typeFilter !== "all" && it.type !== typeFilter) return false;
      if (shopFilter !== "all") {
        if (shopFilter === "none") {
          if (it.shop_id) return false;
        } else if (it.shop_id !== shopFilter) {
          return false;
        }
      }
      if (statusFilter !== "all" && statusOf(it) !== statusFilter) return false;
      return true;
    });

    const sorted = [...list].sort((a, b) => {
      switch (sortBy) {
        case "oldest":
          return (
            new Date(a.created_at || 0).getTime() -
            new Date(b.created_at || 0).getTime()
          );
        case "type":
          return typeLabel(a.type).localeCompare(typeLabel(b.type), "ja");
        case "shop": {
          const an = a.shop_id ? shopNameById.get(a.shop_id) ?? "" : "";
          const bn = b.shop_id ? shopNameById.get(b.shop_id) ?? "" : "";
          return an.localeCompare(bn, "ja");
        }
        case "remaining":
          return remainingOf(a) - remainingOf(b);
        case "newest":
        default:
          return (
            new Date(b.created_at || 0).getTime() -
            new Date(a.created_at || 0).getTime()
          );
      }
    });

    return sorted;
  }, [items, search, typeFilter, shopFilter, statusFilter, sortBy, shopNameById]);

  function renderItem(item: Item) {
    const pct = gachaAppearancePct(item, totalWeight);
    const outOfStock = statusOf(item) === "out_of_stock";
    return (
      <div key={item.id}>
        <GachaItemRow
          item={item}
          shopName={item.shop_id ? shopNameById.get(item.shop_id) ?? null : null}
        />
        {pct && (
          <div className="text-xs text-gray-500 mt-1 ml-1">
            出現割合（概算・抽選対象のみ）: {pct}%
          </div>
        )}
        {outOfStock && (
          <div className="text-xs text-red-600 mt-1 ml-1 font-bold">
            在庫切れのため抽選対象外
          </div>
        )}
      </div>
    );
  }

  const groups: { key: StatusKind; label: string; cls: string; items: Item[] }[] = [
    { key: "active", label: "有効（在庫あり）", cls: "text-green-700", items: [] },
    { key: "out_of_stock", label: "在庫切れ", cls: "text-red-600", items: [] },
    { key: "inactive", label: "無効", cls: "text-gray-500", items: [] },
  ];
  if (grouped) {
    for (const it of filtered) {
      const s = statusOf(it);
      groups.find((g) => g.key === s)?.items.push(it);
    }
  }

  const selectCls =
    "border border-gray-200 bg-white px-2 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-orange-400";

  return (
    <div className="space-y-4">
      {/* サマリー */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <SummaryChip label="有効（在庫あり）" value={counts.active} className="text-green-700" />
        <SummaryChip label="在庫切れ" value={counts.out} className="text-red-600" />
        <SummaryChip label="無効" value={counts.inactive} className="text-gray-500" />
        <SummaryChip label="景品の種類数" value={counts.kinds} className="text-blue-700" />
      </div>

      {/* 検索・絞り込み・並び替え */}
      <div className="bg-white border border-gray-200 p-3 space-y-2">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="景品名・説明で検索"
            className="w-full border border-gray-200 bg-white py-1.5 pl-8 pr-8 text-sm focus:outline-none focus:ring-1 focus:ring-orange-400"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              aria-label="クリア"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={selectCls}
          >
            <option value="all">状態：すべて</option>
            <option value="active">有効（在庫あり）</option>
            <option value="out_of_stock">在庫切れ</option>
            <option value="inactive">無効</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className={selectCls}
          >
            <option value="all">種類：すべて</option>
            {typesPresent.map((t) => (
              <option key={t} value={t}>
                {typeLabel(t)}
              </option>
            ))}
          </select>

          <select
            value={shopFilter}
            onChange={(e) => setShopFilter(e.target.value)}
            className={selectCls}
          >
            <option value="all">店舗：すべて</option>
            <option value="none">共通（指定なし）</option>
            {shops.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className={selectCls}
          >
            <option value="newest">新しい順</option>
            <option value="oldest">古い順</option>
            <option value="type">種類別</option>
            <option value="shop">店舗別</option>
            <option value="remaining">残り在庫が少ない順</option>
          </select>

          <label className="ml-auto flex items-center gap-1.5 text-sm text-gray-600 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={grouped}
              onChange={(e) => setGrouped(e.target.checked)}
              className="h-4 w-4 text-orange-500 focus:ring-orange-500 border-gray-300"
            />
            状態でグループ表示
          </label>
        </div>

        <div className="text-xs text-gray-400">
          {filtered.length} 件を表示中（全 {counts.total} 件）
        </div>
      </div>

      {/* 一覧 */}
      {filtered.length === 0 ? (
        <div className="text-center py-10 text-gray-500">
          条件に一致する景品はありません
        </div>
      ) : grouped ? (
        <div className="space-y-6">
          {groups
            .filter((g) => g.items.length > 0)
            .map((g) => (
              <div key={g.key} className="space-y-2">
                <div className={`flex items-center gap-2 text-sm font-bold ${g.cls}`}>
                  {g.label}
                  <span className="text-xs font-normal text-gray-400">
                    {g.items.length} 件
                  </span>
                </div>
                <div className="grid gap-4">{g.items.map(renderItem)}</div>
              </div>
            ))}
        </div>
      ) : (
        <div className="grid gap-4">{filtered.map(renderItem)}</div>
      )}
    </div>
  );
}

function SummaryChip({
  label,
  value,
  className,
}: {
  label: string;
  value: number;
  className?: string;
}) {
  return (
    <div className="bg-white border border-gray-200 px-3 py-2">
      <div className="text-[11px] text-gray-500">{label}</div>
      <div className={`text-xl font-black leading-tight ${className ?? "text-gray-900"}`}>
        {value}
      </div>
    </div>
  );
}
