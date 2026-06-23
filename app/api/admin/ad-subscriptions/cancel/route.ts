import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { squareClient } from "@/lib/square";
import { isAdminEmail } from "@/lib/admin";
import { deriveDbStatusFromSubscription, nextRenewalDateFrom } from "@/lib/subscription";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !isAdminEmail(user.email)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as { subscriptionId?: unknown };
  const subscriptionId =
    typeof body.subscriptionId === "string" && body.subscriptionId.length > 0
      ? body.subscriptionId
      : null;

  if (!subscriptionId) {
    return NextResponse.json({ error: "subscriptionId is required" }, { status: 400 });
  }

  const admin = createAdminClient();

  async function persist(status: "canceling" | "canceled") {
    await admin
      .from("ad_subscriptions")
      .update({ subscription_status: status, updated_at: new Date().toISOString() })
      .eq("square_subscription_id", subscriptionId);
  }

  try {
    // すでに解約予約済みかを先に確認
    try {
      const { subscription } = await squareClient.subscriptions.get({ subscriptionId });
      const derived = deriveDbStatusFromSubscription(subscription);
      const chargedThroughDate = subscription?.chargedThroughDate ?? null;

      if (derived === "canceling" || derived === "canceled") {
        await persist(derived);
        return NextResponse.json({
          success: true,
          status: derived,
          charged_through_date: chargedThroughDate,
          next_renewal_date: nextRenewalDateFrom(chargedThroughDate),
        });
      }
    } catch {
      // retrieve が落ちても cancel を試す
    }

    const { subscription } = await squareClient.subscriptions.cancel({ subscriptionId });
    const chargedThroughDate = subscription?.chargedThroughDate ?? null;
    const nextStatus = subscription?.status === "CANCELED" ? "canceled" : "canceling";

    await persist(nextStatus);

    return NextResponse.json({
      success: true,
      status: nextStatus,
      charged_through_date: chargedThroughDate,
      next_renewal_date: nextRenewalDateFrom(chargedThroughDate),
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Cancel failed";
    if (message.includes("already has a pending cancel date")) {
      await persist("canceling");
      return NextResponse.json({ success: true, status: "canceling" });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
