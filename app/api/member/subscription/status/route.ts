import { createClient } from "@/lib/supabase/server";
import { squareClient } from "@/lib/square";
import { NextResponse } from "next/server";

function mapSquareStatusToDb(status?: string | null) {
  switch (status) {
    case "ACTIVE":
      return "active";
    case "CANCELING":
      return "canceling";
    case "CANCELED":
      return "canceled";
    case "PAST_DUE":
      return "past_due";
    default:
      return null;
  }
}

function deriveDbStatusFromSubscription(subscription: unknown) {
  const sub = subscription as { status?: unknown; canceled_date?: unknown; cancel_at?: unknown };
  const squareStatus = typeof sub.status === "string" ? sub.status : null;
  const mapped = mapSquareStatusToDb(squareStatus);
  if (mapped && mapped !== "active") return mapped;

  // Squareが ACTIVE を返していても、キャンセル予約が入っている場合があるため補完する
  // - canceled_date が未来日で入っている
  // - cancel_at が存在する
  const canceledDate = typeof sub.canceled_date === "string" ? sub.canceled_date : null;
  const cancelAt = typeof sub.cancel_at === "string" ? sub.cancel_at : null;
  if (cancelAt) return "canceling";

  const today = new Date().toISOString().slice(0, 10);
  if (canceledDate && canceledDate > today) return "canceling";

  return mapped; // active or null
}

function addDays(ymd: string, days: number) {
  // ymd: YYYY-MM-DD
  const [y, m, d] = ymd.split("-").map((v) => Number(v));
  const date = new Date(Date.UTC(y, m - 1, d));
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = user.id;

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("subscription_status, subscription_id, square_customer_id")
    .eq("id", user.id)
    .single();

  if (error) {
    return NextResponse.json({ error: "Failed to load profile" }, { status: 500 });
  }

  let subscriptionId = profile?.subscription_id ?? null;
  let status = profile?.subscription_status ?? null;
  let chargedThroughDate: string | null = null;
  let nextRenewalDate: string | null = null;

  async function syncFromSquareSubscription(subscription: unknown) {
    const sub = subscription as {
      id?: string;
      status?: string;
      charged_through_date?: string;
      canceled_date?: string;
      cancel_at?: string;
    };

    chargedThroughDate = sub.charged_through_date ?? null;
    nextRenewalDate = chargedThroughDate ? addDays(chargedThroughDate, 1) : null;

    const mapped = deriveDbStatusFromSubscription(sub);
    if (mapped && mapped !== status) {
      status = mapped;
    }

    if (sub.id && sub.id !== subscriptionId) {
      subscriptionId = sub.id;
    }

    if (subscriptionId) {
      await supabase
        .from("profiles")
        .update({
          subscription_id: subscriptionId,
          subscription_status: status,
        })
        .eq("id", userId);
    }
  }

  // Squareの状態が取れるなら同期（DBが古い/手動変更/更新タイミングのズレ対策）
  try {
    if (subscriptionId) {
      const { result } = await squareClient.subscriptions.retrieve(subscriptionId);
      await syncFromSquareSubscription((result as { subscription?: unknown }).subscription);
    } else {
      // まれに「Square側では作成済みだが、DBにsubscription_idが保存されない」ケースがあるので再発見する
      const customerId = (profile as { square_customer_id?: string | null } | null)?.square_customer_id ?? null;
      if (customerId) {
        const filter: { customer_ids: string[]; location_ids?: string[] } = {
          customer_ids: [customerId],
        };
        if (process.env.SQUARE_LOCATION_ID) {
          filter.location_ids = [process.env.SQUARE_LOCATION_ID];
        }

        const { result } = await squareClient.subscriptions.search({
          query: { filter },
          sort: { field: "CREATED_AT", order: "DESC" },
        });

        const subscriptions = (result as { subscriptions?: unknown[] }).subscriptions ?? [];
        if (subscriptions.length > 0) {
          await syncFromSquareSubscription(subscriptions[0]);
        }
      }
    }
  } catch {
    // Square取得に失敗しても画面はDBの値で動かす
  }

  return NextResponse.json({
    subscription_status: status,
    subscription_id: subscriptionId,
    charged_through_date: chargedThroughDate,
    next_renewal_date: nextRenewalDate,
  });
}
