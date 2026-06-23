import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { squareClient } from "@/lib/square";
import { deriveDbStatusFromSubscription } from "@/lib/subscription";
import type { Square } from "square";
import { NextResponse } from "next/server";

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("subscription_status, subscription_id, square_customer_id")
    .eq("id", user.id)
    .single();

  if (error) {
    return NextResponse.json({ error: "Failed to load profile" }, { status: 500 });
  }

  // 保護カラム(subscription_*)はservice role経由でのみ更新する
  const admin = createAdminClient();

  const existingSubscriptionId = profile?.subscription_id ?? null;
  const customerId = profile?.square_customer_id ?? null;

  try {
    let subscription: Square.Subscription | null = null;

    if (existingSubscriptionId) {
      const { subscription: sub } = await squareClient.subscriptions.get({
        subscriptionId: existingSubscriptionId,
      });
      subscription = sub ?? null;
    } else if (customerId) {
      const filter: { customerIds: string[]; locationIds?: string[] } = {
        customerIds: [customerId],
      };
      if (process.env.SQUARE_LOCATION_ID) filter.locationIds = [process.env.SQUARE_LOCATION_ID];

      const { subscriptions } = await squareClient.subscriptions.search({
        query: { filter },
      });

      subscription = subscriptions?.[0] ?? null;
    }

    if (!subscription) {
      return NextResponse.json({
        subscription_status: profile?.subscription_status ?? null,
        subscription_id: existingSubscriptionId,
        synced: false,
      });
    }

    const nextStatus = deriveDbStatusFromSubscription(subscription);
    const nextSubscriptionId = subscription.id ?? existingSubscriptionId;

    await admin
      .from("profiles")
      .update({
        subscription_id: nextSubscriptionId,
        subscription_status: nextStatus,
      })
      .eq("id", user.id);

    return NextResponse.json({
      subscription_status: nextStatus,
      subscription_id: nextSubscriptionId,
      synced: true,
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Resync failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
