import { createClient } from "@/lib/supabase/server";
import { squareClient } from "@/lib/square";
import { NextResponse } from "next/server";

function addDays(ymd: string, days: number) {
  const [y, m, d] = ymd.split("-").map((v) => Number(v));
  const date = new Date(Date.UTC(y, m - 1, d));
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function deriveDbStatusFromSubscription(subscription: unknown) {
  const sub = subscription as { status?: unknown; canceled_date?: unknown; cancel_at?: unknown };
  const squareStatus = typeof sub.status === "string" ? sub.status : null;
  if (squareStatus === "CANCELED") return "canceled";
  if (squareStatus === "CANCELING") return "canceling";
  if (squareStatus === "PAST_DUE") return "past_due";

  // ACTIVEでもキャンセル予約が入っていることがある
  const canceledDate = typeof sub.canceled_date === "string" ? sub.canceled_date : null;
  const cancelAt = typeof sub.cancel_at === "string" ? sub.cancel_at : null;
  if (cancelAt) return "canceling";
  const today = new Date().toISOString().slice(0, 10);
  if (canceledDate && canceledDate > today) return "canceling";

  return "active";
}

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("subscription_id, subscription_status")
    .eq("id", user.id)
    .single();

  if (profileError) {
    return NextResponse.json({ error: "Failed to load profile" }, { status: 500 });
  }

  const subscriptionId = profile?.subscription_id;
  if (!subscriptionId) {
    return NextResponse.json({ error: "No active subscription" }, { status: 400 });
  }

  // すでに解約状態の場合はそのまま返す
  if (profile?.subscription_status === "canceling" || profile?.subscription_status === "canceled") {
    return NextResponse.json({ success: true, status: profile.subscription_status });
  }

  try {
    // Square側で既に解約予約済みの場合があるので、先にretrieveして判定する
    try {
      const { result: retrieveResult } = await squareClient.subscriptions.retrieve(subscriptionId);
      const subscription = retrieveResult.subscription;
      const derived = deriveDbStatusFromSubscription(subscription);
      const chargedThroughDate = (subscription?.charged_through_date as string | undefined) ?? null;
      const nextRenewalDate = chargedThroughDate ? addDays(chargedThroughDate, 1) : null;

      if (derived === "canceling" || derived === "canceled") {
        await supabase
          .from("profiles")
          .update({ subscription_status: derived })
          .eq("id", user.id);

        return NextResponse.json({
          success: true,
          status: derived,
          charged_through_date: chargedThroughDate,
          next_renewal_date: nextRenewalDate,
        });
      }
    } catch {
      // retrieveが落ちてもcancelを試す
    }

    const { result } = await squareClient.subscriptions.cancel(subscriptionId);
    const statusFromSquare = result.subscription?.status as string | undefined;
    const chargedThroughDate = (result.subscription?.charged_through_date as string | undefined) ?? null;
    const nextRenewalDate = chargedThroughDate ? addDays(chargedThroughDate, 1) : null;

    const nextStatus = statusFromSquare === "CANCELED"
      ? "canceled"
      : statusFromSquare === "CANCELING"
        ? "canceling"
        : "canceling";

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ subscription_status: nextStatus })
      .eq("id", user.id);

    if (updateError) {
      return NextResponse.json({ error: "Failed to update subscription status" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      status: nextStatus,
      charged_through_date: chargedThroughDate,
      next_renewal_date: nextRenewalDate,
    });
  } catch (e: unknown) {
    // Squareが「既に解約予約がある」と言う場合は、canceling扱いに寄せる
    const message = e instanceof Error ? e.message : "Cancel failed";
    if (message.includes("already has a pending cancel date")) {
      await supabase
        .from("profiles")
        .update({ subscription_status: "canceling" })
        .eq("id", user.id);
      return NextResponse.json({ success: true, status: "canceling" });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
