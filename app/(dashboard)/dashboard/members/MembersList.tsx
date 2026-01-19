"use client";

import Image from "next/image";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import {
  ChevronDown,
  ChevronRight,
  User,
  Banknote,
  X,
  Search,
  Users,
  Crown,
  CreditCard,
  Clock,
  Gift,
} from "lucide-react";
import { useMemo, useState } from "react";

type ProfileRow = any;

type UserItemRow = {
  user_id: string;
  is_used: boolean | null;
  created_at: string | null;
  expires_at: string | null;
  gacha_items?: {
    name: string | null;
    type: string | null;
    value: number | null;
  } | null;
};

type FilterType = "all" | "active" | "cash" | "card" | "inactive";

function statusBadge(status?: string | null, paymentMethod?: string | null) {
  const base = "text-[10px] px-2 py-0.5 rounded-full font-bold inline-flex items-center gap-1";
  if (status === "active" || status === "canceling") {
    if (paymentMethod === "cash") {
      return `${base} bg-orange-100 text-orange-700`;
    }
    return `${base} bg-green-100 text-green-700`;
  }
  switch (status) {
    case "past_due":
      return `${base} bg-red-100 text-red-700`;
    case "canceled":
      return `${base} bg-gray-100 text-gray-600`;
    case "inactive":
    default:
      return `${base} bg-gray-100 text-gray-600`;
  }
}

function statusLabel(status?: string | null, paymentMethod?: string | null) {
  if (status === "active" && paymentMethod === "cash") return "現金会員";
  if (status === "active") return "有効";
  if (status === "canceling" && paymentMethod === "cash") return "現金(解約予定)";
  if (status === "canceling") return "解約予定";
  switch (status) {
    case "past_due":
      return "支払いエラー";
    case "canceled":
      return "解約済み";
    case "inactive":
    default:
      return "未登録";
  }
}

function StatusIcon({ status, paymentMethod }: { status?: string | null; paymentMethod?: string | null }) {
  if (status === "active" || status === "canceling") {
    if (paymentMethod === "cash") {
      return <Banknote className="w-3 h-3" />;
    }
    return <CreditCard className="w-3 h-3" />;
  }
  return null;
}

export function MembersList({
  profiles,
  userItems,
}: {
  profiles: ProfileRow[];
  userItems: UserItemRow[];
}) {
  const [openUserId, setOpenUserId] = useState<string | null>(null);
  const [cashModalUserId, setCashModalUserId] = useState<string | null>(null);
  const [cashMonths, setCashMonths] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");
  const [couponTab, setCouponTab] = useState<"unused" | "used">("unused");

  const handleGrantCashSubscription = async (userId: string) => {
    setIsLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/members/cash-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, months: cashMonths }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "付与に失敗しました");
      setMessage({ type: "success", text: data.message });
      setCashModalUserId(null);
      // ページをリロードして最新状態を反映
      setTimeout(() => window.location.reload(), 1000);
    } catch (e: any) {
      setMessage({ type: "error", text: e.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRevokeCashSubscription = async (userId: string) => {
    if (!confirm("現金サブスクを解除しますか？")) return;
    setIsLoading(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/members/cash-subscription?userId=${userId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "解除に失敗しました");
      setMessage({ type: "success", text: data.message });
      setTimeout(() => window.location.reload(), 1000);
    } catch (e: any) {
      setMessage({ type: "error", text: e.message });
    } finally {
      setIsLoading(false);
    }
  };

  const itemsByUserId = useMemo(() => {
    return (userItems || []).reduce((acc, row) => {
      const key = row.user_id;
      if (!acc[key]) acc[key] = [];
      acc[key].push(row);
      return acc;
    }, {} as Record<string, UserItemRow[]>);
  }, [userItems]);

  // 統計情報
  const stats = useMemo(() => {
    const total = profiles.length;
    const active = profiles.filter(
      (p: ProfileRow) => p.subscription_status === "active" || p.subscription_status === "canceling"
    ).length;
    const cashMembers = profiles.filter(
      (p: ProfileRow) =>
        (p.subscription_status === "active" || p.subscription_status === "canceling") &&
        p.payment_method === "cash"
    ).length;
    const cardMembers = active - cashMembers;
    return { total, active, cashMembers, cardMembers };
  }, [profiles]);

  // フィルタリング
  const filteredProfiles = useMemo(() => {
    let result = profiles;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((p: ProfileRow) => {
        const name = (p.display_name || "").toLowerCase();
        const id = (p.id || "").toLowerCase();
        return name.includes(q) || id.includes(q);
      });
    }

    switch (filter) {
      case "active":
        result = result.filter(
          (p: ProfileRow) => p.subscription_status === "active" || p.subscription_status === "canceling"
        );
        break;
      case "cash":
        result = result.filter(
          (p: ProfileRow) =>
            (p.subscription_status === "active" || p.subscription_status === "canceling") &&
            p.payment_method === "cash"
        );
        break;
      case "card":
        result = result.filter(
          (p: ProfileRow) =>
            (p.subscription_status === "active" || p.subscription_status === "canceling") &&
            p.payment_method !== "cash"
        );
        break;
      case "inactive":
        result = result.filter(
          (p: ProfileRow) =>
            p.subscription_status !== "active" && p.subscription_status !== "canceling"
        );
        break;
    }

    return result;
  }, [profiles, searchQuery, filter]);

  return (
    <div className="space-y-6">
      {/* 統計カード */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-100 rounded-lg">
              <Users className="w-5 h-5 text-gray-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
              <div className="text-xs text-gray-500">総会員数</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Crown className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">{stats.active}</div>
              <div className="text-xs text-gray-500">プレミアム会員</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <CreditCard className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">{stats.cardMembers}</div>
              <div className="text-xs text-gray-500">カード払い</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Banknote className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-600">{stats.cashMembers}</div>
              <div className="text-xs text-gray-500">現金払い</div>
            </div>
          </div>
        </div>
      </div>

      {/* 検索・フィルター */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="名前またはユーザーIDで検索..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {[
            { value: "all", label: "すべて", count: profiles.length },
            { value: "active", label: "プレミアム", count: stats.active },
            { value: "card", label: "カード払い", count: stats.cardMembers },
            { value: "cash", label: "現金払い", count: stats.cashMembers },
            { value: "inactive", label: "未登録", count: profiles.length - stats.active },
          ].map((item) => (
            <button
              key={item.value}
              onClick={() => setFilter(item.value as FilterType)}
              className={`px-3 py-1.5 text-xs font-bold rounded-full transition-colors ${
                filter === item.value
                  ? "bg-orange-500 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {item.label} ({item.count})
            </button>
          ))}
        </div>
      </div>

      {/* 会員リスト */}
      <div className="space-y-3">
      {filteredProfiles.length === 0 ? (
        <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-200 text-center">
          <User className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">該当する会員がいません</p>
        </div>
      ) : (
      filteredProfiles.map((profile: ProfileRow) => {
        const createdAt = profile.created_at
          ? format(new Date(profile.created_at), "yyyy/MM/dd", { locale: ja })
          : "-";

        const isVip = Boolean(profile.is_vip);
        const subscriptionStatus = profile.subscription_status as string | null | undefined;
        const paymentMethod = profile.payment_method as string | null | undefined;
        const expiresAt = profile.subscription_expires_at;

        const ownedItems = (itemsByUserId[profile.id] || []).filter((row) => {
          const itemType = row.gacha_items?.type;
          return itemType && itemType !== "none";
        });
        const unusedItems = ownedItems.filter((row) => !row.is_used);
        const usedItems = ownedItems.filter((row) => row.is_used);

        // 未使用を先に表示
        const displayItems = [...unusedItems, ...usedItems];

        const isOpen = openUserId === profile.id;
        const isActive = subscriptionStatus === "active" || subscriptionStatus === "canceling";
        const isCash = paymentMethod === "cash";

        return (
          <div
            key={profile.id}
            className={`bg-white rounded-xl shadow-sm border overflow-hidden transition-all ${
              isActive
                ? isCash
                  ? "border-orange-200"
                  : "border-green-200"
                : "border-gray-200"
            }`}
          >
            <button
              type="button"
              className="w-full text-left p-4 hover:bg-gray-50 transition-colors"
              onClick={() => setOpenUserId(isOpen ? null : profile.id)}
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gray-100 rounded-full overflow-hidden relative flex items-center justify-center shrink-0 ring-2 ring-offset-2 ring-gray-200">
                  {profile.avatar_url ? (
                    <Image
                      src={profile.avatar_url}
                      alt={profile.display_name ?? "user"}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <User className="w-6 h-6 text-gray-300" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="font-bold text-gray-900 truncate">
                      {profile.display_name || "(名前未設定)"}
                    </div>
                    <span className={statusBadge(subscriptionStatus, paymentMethod)}>
                      <StatusIcon status={subscriptionStatus} paymentMethod={paymentMethod} />
                      {statusLabel(subscriptionStatus, paymentMethod)}
                    </span>
                    {isVip && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-yellow-100 text-yellow-700">
                        VIP
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-4 text-xs text-gray-500 mt-1">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {createdAt}
                    </span>
                    {isCash && expiresAt && (
                      <span className="flex items-center gap-1 text-orange-600 font-medium">
                        期限: {format(new Date(expiresAt), "yyyy/MM/dd", { locale: ja })}
                      </span>
                    )}
                    {ownedItems.length > 0 && (
                      <span className="flex items-center gap-1">
                        <Gift className="w-3 h-3" />
                        クーポン {unusedItems.length}/{ownedItems.length}
                      </span>
                    )}
                  </div>
                </div>

                <div className="shrink-0">
                  {isOpen ? (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  )}
                </div>
              </div>
            </button>

            {isOpen && (
              <div className="border-t border-gray-100 bg-gray-50 p-4 space-y-4">
                {/* 詳細情報 */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-white rounded-lg p-2 border border-gray-100">
                    <div className="text-gray-400 mb-1">ユーザーID</div>
                    <div className="font-mono text-gray-700 truncate">{profile.id}</div>
                  </div>
                  <div className="bg-white rounded-lg p-2 border border-gray-100">
                    <div className="text-gray-400 mb-1">Square Customer ID</div>
                    <div className="font-mono text-gray-700 truncate">
                      {profile.square_customer_id || "-"}
                    </div>
                  </div>
                  <div className="bg-white rounded-lg p-2 border border-gray-100">
                    <div className="text-gray-400 mb-1">Subscription ID</div>
                    <div className="font-mono text-gray-700 truncate">
                      {profile.subscription_id || "-"}
                    </div>
                  </div>
                  <div className="bg-white rounded-lg p-2 border border-gray-100">
                    <div className="text-gray-400 mb-1">最終ガチャ</div>
                    <div className="font-mono text-gray-700">
                      {profile.last_gacha_at
                        ? format(new Date(profile.last_gacha_at), "yyyy/MM/dd HH:mm", { locale: ja })
                        : "-"}
                    </div>
                  </div>
                </div>

                {/* クーポン一覧 */}
                {displayItems.length > 0 && (() => {
                  const unusedItems = displayItems.filter(item => !item.is_used);
                  const usedItems = displayItems.filter(item => item.is_used);
                  const currentItems = couponTab === "unused" ? unusedItems : usedItems;

                  return (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-xs font-bold text-gray-700">所持クーポン</div>
                        <div className="text-[10px] text-gray-500">
                          計 {displayItems.length}枚
                        </div>
                      </div>
                      
                      {/* タブ切り替え */}
                      <div className="flex gap-1 mb-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setCouponTab("unused");
                          }}
                          className={`flex-1 text-xs py-1.5 px-2 rounded-lg font-bold transition-colors ${
                            couponTab === "unused"
                              ? "bg-blue-600 text-white"
                              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                          }`}
                        >
                          未使用 ({unusedItems.length})
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setCouponTab("used");
                          }}
                          className={`flex-1 text-xs py-1.5 px-2 rounded-lg font-bold transition-colors ${
                            couponTab === "used"
                              ? "bg-gray-600 text-white"
                              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                          }`}
                        >
                          使用済み ({usedItems.length})
                        </button>
                      </div>

                      {/* クーポンリスト（スクロール可能） */}
                      {currentItems.length > 0 ? (
                        <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 scrollbar-thin">
                          {currentItems.map((row, idx) => {
                            const itemName = row.gacha_items?.name ?? "(unknown)";
                            const itemType = row.gacha_items?.type ?? "";
                            const itemValue = row.gacha_items?.value;
                            const expires = row.expires_at
                              ? format(new Date(row.expires_at), "MM/dd", { locale: ja })
                              : null;

                            return (
                              <div
                                key={`${profile.id}-${couponTab}-${idx}`}
                                className={`flex items-center gap-2 bg-white border rounded-lg px-2.5 py-1.5 ${
                                  row.is_used ? "border-gray-200 opacity-60" : "border-gray-100"
                                }`}
                              >
                                <Gift className={`w-3.5 h-3.5 shrink-0 ${row.is_used ? "text-gray-400" : "text-blue-500"}`} />
                                <div className="min-w-0 flex-1">
                                  <div className="text-xs font-bold text-gray-900 truncate">
                                    {itemName}
                                  </div>
                                  <div className="text-[10px] text-gray-500 truncate">
                                    {itemType}
                                    {typeof itemValue === "number" && itemValue > 0 && ` / ${itemValue}円`}
                                  </div>
                                </div>
                                {expires && (
                                  <span className="text-[10px] text-gray-400 shrink-0">
                                    ~{expires}
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="text-xs text-gray-400 text-center py-3">
                          {couponTab === "unused" ? "未使用クーポンなし" : "使用済みクーポンなし"}
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* アクションボタン */}
                <div className="flex gap-2 pt-2 border-t border-gray-200">
                  {isCash ? (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRevokeCashSubscription(profile.id);
                      }}
                      disabled={isLoading}
                      className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors disabled:opacity-50"
                    >
                      <X className="w-3.5 h-3.5" />
                      現金サブスク解除
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setCashModalUserId(profile.id);
                        setCashMonths(1);
                      }}
                      className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition-colors"
                    >
                      <Banknote className="w-3.5 h-3.5" />
                      現金サブスク付与
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })
      )}
      </div>

      {/* 検索結果数 */}
      {filteredProfiles.length > 0 && (
        <div className="text-center text-xs text-gray-400">
          {filteredProfiles.length}件を表示
        </div>
      )}

      {/* メッセージトースト */}
      {message && (
        <div
          className={`fixed bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-lg text-sm font-bold shadow-lg z-50 ${
            message.type === "success"
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* 現金サブスク付与モーダル */}
      {cashModalUserId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Banknote className="w-5 h-5 text-orange-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">現金サブスクを付与</h3>
            </div>
            <p className="text-sm text-gray-600 mb-4 bg-gray-50 rounded-lg p-3 font-mono truncate">
              {cashModalUserId}
            </p>
            <div className="mb-6">
              <label className="block text-sm font-bold text-gray-700 mb-2">有効期間</label>
              <div className="grid grid-cols-5 gap-2">
                {[1, 2, 3, 6, 12].map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setCashMonths(m)}
                    className={`py-2 text-sm font-bold rounded-lg transition-colors ${
                      cashMonths === m
                        ? "bg-orange-500 text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {m}ヶ月
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setCashModalUserId(null)}
                className="flex-1 px-4 py-2.5 text-sm font-bold bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                キャンセル
              </button>
              <button
                type="button"
                onClick={() => handleGrantCashSubscription(cashModalUserId)}
                disabled={isLoading}
                className="flex-1 px-4 py-2.5 text-sm font-bold bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 transition-colors"
              >
                {isLoading ? "処理中..." : "付与する"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
