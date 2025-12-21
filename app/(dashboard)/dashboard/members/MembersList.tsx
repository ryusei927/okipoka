"use client";

import Image from "next/image";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { ChevronDown, ChevronRight, User } from "lucide-react";
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
    </div>
  );
}
