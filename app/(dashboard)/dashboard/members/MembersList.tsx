"use client";

import Image from "next/image";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { ChevronDown, ChevronRight, User, Crown } from "lucide-react";
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

function statusBadge(status?: string | null) {
  const base = "text-[10px] px-2 py-0.5 rounded-full font-bold";
  switch (status) {
    case "active":
      return `${base} bg-green-100 text-green-700`;
    case "canceling":
      return `${base} bg-yellow-100 text-yellow-800`;
    case "past_due":
      return `${base} bg-red-100 text-red-700`;
    case "canceled":
      return `${base} bg-gray-100 text-gray-600`;
    case "inactive":
    default:
      return `${base} bg-gray-100 text-gray-600`;
  }
}

function statusLabel(status?: string | null) {
  switch (status) {
    case "active":
      return "有効";
    case "canceling":
      return "解約予定";
    case "past_due":
      return "支払いエラー";
    case "canceled":
      return "解約済み";
    case "inactive":
    default:
      return "未登録";
  }
}

export function MembersList({
  profiles,
  userItems,
}: {
  profiles: ProfileRow[];
  userItems: UserItemRow[];
}) {
  const [openUserId, setOpenUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState<string | null>(null); // userId of loading action
  const [message, setMessage] = useState<{ userId: string; text: string; type: "success" | "error" } | null>(null);
  const [showPeriodModal, setShowPeriodModal] = useState<{ userId: string; displayName: string } | null>(null);

  // 期間選択後にプレミアム付与
  async function grantPremium(userId: string, months: number) {
    setShowPeriodModal(null);
    setLoading(userId);
    setMessage(null);

    // 有効期限を計算
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + months);
    const expiresAtStr = expiresAt.toISOString().slice(0, 10); // YYYY-MM-DD

    try {
      const res = await fetch("/api/admin/members/premium", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, action: "grant", expiresAt: expiresAtStr }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Failed");

      setMessage({ userId, text: `${months}ヶ月のプレミアム会員を付与しました（${expiresAtStr}まで）`, type: "success" });
      setTimeout(() => window.location.reload(), 1500);
    } catch (e: any) {
      setMessage({ userId, text: e.message, type: "error" });
    } finally {
      setLoading(null);
    }
  }

  // プレミアム解除（現金払いのみ）
  async function revokePremium(userId: string, displayName: string) {
    const confirmed = window.confirm(`${displayName} さんのプレミアムを解除しますか？`);
    if (!confirmed) return;

    setLoading(userId);
    setMessage(null);

    try {
      const res = await fetch("/api/admin/members/premium", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, action: "revoke" }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Failed");

      setMessage({ userId, text: data.message, type: "success" });
      setTimeout(() => window.location.reload(), 1000);
    } catch (e: any) {
      setMessage({ userId, text: e.message, type: "error" });
    } finally {
      setLoading(null);
    }
  }

  const itemsByUserId = useMemo(() => {
    return (userItems || []).reduce((acc, row) => {
      const key = row.user_id;
      if (!acc[key]) acc[key] = [];
      acc[key].push(row);
      return acc;
    }, {} as Record<string, UserItemRow[]>);
  }, [userItems]);

  return (
    <div className="grid gap-4">
      {profiles?.map((profile: any) => {
        const createdAt = profile.created_at
          ? format(new Date(profile.created_at), "yyyy/MM/dd HH:mm", { locale: ja })
          : "-";

        const isVip = Boolean(profile.is_vip);
        const subscriptionStatus = profile.subscription_status as
          | string
          | null
          | undefined;

        const ownedItems = (itemsByUserId[profile.id] || []).filter((row) => {
          const itemType = row.gacha_items?.type;
          return itemType && itemType !== "none";
        });
        const unusedItems = ownedItems.filter((row) => !row.is_used);
        const usedItems = ownedItems.filter((row) => row.is_used);

        // 未使用を先に表示
        const displayItems = [...unusedItems, ...usedItems];

        const isOpen = openUserId === profile.id;

        return (
          <div
            key={profile.id}
            className="bg-white p-4 rounded-xl shadow-sm border border-gray-200"
          >
            <button
              type="button"
              className="w-full text-left"
              onClick={() => setOpenUserId(isOpen ? null : profile.id)}
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gray-100 rounded-full overflow-hidden relative flex items-center justify-center shrink-0">
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
                      {profile.display_name || "(no name)"}
                    </div>
                    <span className={statusBadge(subscriptionStatus)}>
                      {statusLabel(subscriptionStatus)}
                    </span>
                    {isVip && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-yellow-100 text-yellow-700">
                        VIP
                      </span>
                    )}
                    {/* 未登録・解約済みの場合は付与ボタンを表示 */}
                    {subscriptionStatus !== "active" && subscriptionStatus !== "canceling" && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowPeriodModal({ userId: profile.id, displayName: profile.display_name || "このユーザー" });
                        }}
                        disabled={loading === profile.id}
                        className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-50"
                      >
                        {loading === profile.id ? "..." : "付与"}
                      </button>
                    )}
                  </div>

                  <div className="text-xs text-gray-500 mt-1">
                    <span className="mr-3">作成: {createdAt}</span>
                    <span className="mr-3">
                      UID: {String(profile.id).slice(0, 8)}…
                    </span>
                  </div>

                  <div className="text-xs text-gray-500 mt-1">
                    <span className="mr-3">
                      subscription_id:{" "}
                      {profile.subscription_id
                        ? String(profile.subscription_id).slice(0, 10) + "…"
                        : "-"}
                    </span>
                    <span className="mr-3">
                      square_customer_id:{" "}
                      {profile.square_customer_id
                        ? String(profile.square_customer_id).slice(0, 10) + "…"
                        : "-"}
                    </span>
                    <span>
                      last_gacha_at:{" "}
                      {profile.last_gacha_at
                        ? format(new Date(profile.last_gacha_at), "yyyy/MM/dd", {
                            locale: ja,
                          })
                        : "-"}
                    </span>
                  </div>

                  <div className="text-xs font-bold text-gray-700 mt-2 flex items-center gap-1">
                    {isOpen ? (
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    )}
                    所持クーポン: {ownedItems.length} (未使用: {unusedItems.length})
                    <span className="text-gray-400 font-normal">
                      （クリックで{isOpen ? "閉じる" : "表示"}）
                    </span>
                  </div>
                </div>
              </div>
            </button>

            {isOpen && (
              <div className="mt-4 border-t border-gray-100 pt-3">
                {/* プレミアム会員管理ボタン */}
                <div className="mb-4 p-3 bg-orange-50 rounded-lg">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <Crown className="w-4 h-4 text-orange-600" />
                      <span className="text-sm font-bold text-orange-800">プレミアム会員管理</span>
                      {profile.payment_method === "cash" && profile.subscription_expires_at && (
                        <span className="text-xs text-gray-600">
                          （期限: {format(new Date(profile.subscription_expires_at), "yyyy/MM/dd", { locale: ja })}）
                        </span>
                      )}
                    </div>
                    {subscriptionStatus === "active" || subscriptionStatus === "canceling" ? (
                      // 現金払いの人のみ解除可能
                      profile.payment_method === "cash" ? (
                        <button
                          onClick={() => revokePremium(profile.id, profile.display_name || "このユーザー")}
                          disabled={loading === profile.id}
                          className="px-3 py-1.5 text-xs font-bold bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50"
                        >
                          {loading === profile.id ? "処理中..." : "プレミアム解除"}
                        </button>
                      ) : (
                        <span className="text-xs text-gray-500">
                          カード払い（ユーザー側で解約）
                        </span>
                      )
                    ) : (
                      <button
                        onClick={() => setShowPeriodModal({ userId: profile.id, displayName: profile.display_name || "このユーザー" })}
                        disabled={loading === profile.id}
                        className="px-3 py-1.5 text-xs font-bold bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50"
                      >
                        {loading === profile.id ? "処理中..." : "プレミアム付与（現金払い）"}
                      </button>
                    )}
                  </div>
                  {message?.userId === profile.id && message && (
                    <div className={`mt-2 text-xs ${message.type === "success" ? "text-green-700" : "text-red-600"}`}>
                      {message.text}
                    </div>
                  )}
                </div>

                {displayItems.length > 0 ? (
                  <div className="grid gap-2">
                    {displayItems.map((row, idx) => {
                      const itemName = row.gacha_items?.name ?? "(unknown)";
                      const itemType = row.gacha_items?.type ?? "";
                      const itemValue = row.gacha_items?.value;
                      const expires = row.expires_at
                        ? format(new Date(row.expires_at), "yyyy/MM/dd", {
                            locale: ja,
                          })
                        : null;
                      const isUsed = row.is_used;

                      return (
                        <div
                          key={`${profile.id}-${idx}`}
                          className={`flex items-center justify-between border rounded-lg px-3 py-2 ${
                            isUsed
                              ? "bg-gray-100 border-gray-200 opacity-70"
                              : "bg-gray-50 border-gray-100"
                          }`}
                        >
                          <div className="min-w-0">
                            <div className="text-sm font-bold text-gray-900 truncate">
                              {itemName}
                            </div>
                            <div className="text-xs text-gray-500">
                              {itemType}
                              {typeof itemValue === "number" && itemValue > 0
                                ? ` / ${itemValue}円`
                                : ""}
                              {expires ? ` / 期限: ${expires}` : ""}
                            </div>
                          </div>
                          {isUsed ? (
                            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-gray-200 text-gray-600 shrink-0">
                              使用済み
                            </span>
                          ) : (
                            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-blue-100 text-blue-700 shrink-0">
                              未使用
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-sm text-gray-500">
                    クーポンはありません
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}

      {profiles?.length === 0 && (
        <div className="text-center py-10 text-gray-500">会員がまだいません</div>
      )}

      {/* 期間選択モーダル */}
      {showPeriodModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowPeriodModal(null)}>
          <div className="bg-white rounded-xl p-6 max-w-sm w-full mx-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-900 mb-2">プレミアム期間を選択</h3>
            <p className="text-sm text-gray-600 mb-4">
              {showPeriodModal.displayName} さんにプレミアム会員を付与します
            </p>
            <div className="grid gap-2">
              <button
                onClick={() => grantPremium(showPeriodModal.userId, 1)}
                className="w-full py-3 px-4 bg-orange-100 text-orange-800 font-bold rounded-lg hover:bg-orange-200 transition-colors"
              >
                1ヶ月（お試し）
              </button>
              <button
                onClick={() => grantPremium(showPeriodModal.userId, 3)}
                className="w-full py-3 px-4 bg-orange-100 text-orange-800 font-bold rounded-lg hover:bg-orange-200 transition-colors"
              >
                3ヶ月
              </button>
              <button
                onClick={() => grantPremium(showPeriodModal.userId, 6)}
                className="w-full py-3 px-4 bg-orange-100 text-orange-800 font-bold rounded-lg hover:bg-orange-200 transition-colors"
              >
                6ヶ月
              </button>
              <button
                onClick={() => grantPremium(showPeriodModal.userId, 12)}
                className="w-full py-3 px-4 bg-orange-500 text-white font-bold rounded-lg hover:bg-orange-600 transition-colors"
              >
                1年間
              </button>
            </div>
            <button
              onClick={() => setShowPeriodModal(null)}
              className="w-full mt-3 py-2 text-sm text-gray-500 hover:text-gray-700"
            >
              キャンセル
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
