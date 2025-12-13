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

function deriveDbStatusFromSubscription(subscription: any) {
  const squareStatus = (subscription?.status as string | undefined) ?? null;
  const mapped = mapSquareStatusToDb(squareStatus);
  if (mapped && mapped !== "active") return mapped;

  // Squareが ACTIVE を返していても、キャンセル予約が入っている場合があるため補完する
  // - canceled_date が未来日で入っている
  // - cancel_at が存在する
  const canceledDate = (subscription?.canceled_date as string | undefined) ?? null;
  const cancelAt = (subscription?.cancel_at as string | undefined) ?? null;
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

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("subscription_status, subscription_id")
    .eq("id", user.id)
    .single();

  if (error) {
    return NextResponse.json({ error: "Failed to load profile" }, { status: 500 });
  }

  const subscriptionId = profile?.subscription_id ?? null;
  let status = profile?.subscription_status ?? null;
  let chargedThroughDate: string | null = null;
  let nextRenewalDate: string | null = null;

  // Squareの状態が取れるなら同期（DBが古い/手動変更/更新タイミングのズレ対策）
  if (subscriptionId) {
    try {
      const { result } = await squareClient.subscriptions.retrieve(subscriptionId);
      const subscription = result.subscription;
      chargedThroughDate = (subscription?.charged_through_date as string | undefined) ?? null;
      nextRenewalDate = chargedThroughDate ? addDays(chargedThroughDate, 1) : null;
      const mapped = deriveDbStatusFromSubscription(subscription);
      if (mapped && mapped !== status) {
        status = mapped;
        await supabase
          .from("profiles")
          .update({ subscription_status: mapped })
          .eq("id", user.id);
      }
    } catch {
      // Square取得に失敗しても画面はDBの値で動かす
    }
  }

  return NextResponse.json({
    subscription_status: status,
    subscription_id: subscriptionId,
    charged_through_date: chargedThroughDate,
    next_renewal_date: nextRenewalDate,
  });
}
