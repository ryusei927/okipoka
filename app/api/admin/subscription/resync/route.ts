import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { squareClient } from "@/lib/square";
import { deriveDbStatusFromSubscription } from "@/lib/subscription";
import type { Square } from "square";
import { NextResponse } from "next/server";

const ADMIN_EMAIL = (process.env.OKIPOKA_ADMIN_EMAIL ?? "okipoka.jp@gmail.com").toLowerCase();

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const email = (user.email ?? "").toLowerCase();
  if (email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await request.json().catch(() => null)) as
    | { userId?: unknown; squareCustomerId?: unknown }
    | null;

  const userId = typeof body?.userId === "string" ? body.userId : null;
  const squareCustomerId = typeof body?.squareCustomerId === "string" ? body.squareCustomerId : null;

  if (!userId && !squareCustomerId) {
    return NextResponse.json({ error: "userId or squareCustomerId is required" }, { status: 400 });
  }

  const admin = createAdminClient();

  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("id, subscription_status, subscription_id, square_customer_id")
    .eq(userId ? "id" : "square_customer_id", userId ?? squareCustomerId)
    .single();

  if (profileError || !profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  const existingSubscriptionId = (profile as { subscription_id?: string | null }).subscription_id ?? null;
  const customerId = (profile as { square_customer_id?: string | null }).square_customer_id ?? null;

  try {
    let subscription: Square.Subscription | null = null;

    if (existingSubscriptionId) {
      const { subscription: sub } = await squareClient.subscriptions.get({
        subscriptionId: existingSubscriptionId,
      });
      subscription = sub ?? null;
    }

    if (!subscription && customerId) {
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
        user_id: profile.id,
        subscription_id: existingSubscriptionId,
        subscription_status:
          (profile as { subscription_status?: string | null }).subscription_status ?? null,
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
      .eq("id", profile.id);

    return NextResponse.json({
      user_id: profile.id,
      subscription_id: nextSubscriptionId,
      subscription_status: nextStatus,
      synced: true,
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Resync failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
