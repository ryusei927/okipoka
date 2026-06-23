import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { squareClient } from "@/lib/square";
import {
  deriveDbStatusFromSubscription,
  isActiveLikeStatus,
  nextRenewalDateFrom,
} from "@/lib/subscription";
import { NextResponse } from "next/server";

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
    .select("subscription_id, subscription_status, square_customer_id")
    .eq("id", user.id)
    .single();

  if (profileError) {
    return NextResponse.json({ error: "Failed to load profile" }, { status: 500 });
  }

  // 保護カラム(subscription_*)はservice role経由でのみ更新する
  const admin = createAdminClient();

  let subscriptionId = profile?.subscription_id ?? null;
  if (!subscriptionId) {
    // DBにsubscription_idが無いケースを救済（Square側から再発見）
    const customerId = profile?.square_customer_id ?? null;
    if (customerId) {
      try {
        const filter: { customerIds: string[]; locationIds?: string[] } = {
          customerIds: [customerId],
        };
        if (process.env.SQUARE_LOCATION_ID) filter.locationIds = [process.env.SQUARE_LOCATION_ID];

        const { subscriptions } = await squareClient.subscriptions.search({
          query: { filter },
        });

        const candidate = (subscriptions ?? []).find((sub) => isActiveLikeStatus(sub.status));

        subscriptionId = candidate?.id ?? null;
        if (subscriptionId) {
          await admin
            .from("profiles")
            .update({ subscription_id: subscriptionId })
            .eq("id", user.id);
        }
      } catch {
        // 失敗しても通常エラーへ
      }
    }

    if (!subscriptionId) {
      return NextResponse.json({ error: "No active subscription" }, { status: 400 });
    }
  }

  // すでに解約状態の場合はそのまま返す
  if (profile?.subscription_status === "canceling" || profile?.subscription_status === "canceled") {
    return NextResponse.json({ success: true, status: profile.subscription_status });
  }

  try {
    // Square側で既に解約予約済みの場合があるので、先にretrieveして判定する
    try {
      const { subscription } = await squareClient.subscriptions.get({ subscriptionId });
      const derived = deriveDbStatusFromSubscription(subscription);
      const chargedThroughDate = subscription?.chargedThroughDate ?? null;
      const nextRenewalDate = nextRenewalDateFrom(chargedThroughDate);

      if (derived === "canceling" || derived === "canceled") {
        await admin
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

    const { subscription } = await squareClient.subscriptions.cancel({ subscriptionId });
    const chargedThroughDate = subscription?.chargedThroughDate ?? null;
    const nextRenewalDate = nextRenewalDateFrom(chargedThroughDate);

    const nextStatus = subscription?.status === "CANCELED" ? "canceled" : "canceling";

    const { error: updateError } = await admin
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
      await admin
        .from("profiles")
        .update({ subscription_status: "canceling" })
        .eq("id", user.id);
      return NextResponse.json({ success: true, status: "canceling" });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
