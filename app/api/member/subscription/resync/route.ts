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

  const canceledDate = typeof sub.canceled_date === "string" ? sub.canceled_date : null;
  const cancelAt = typeof sub.cancel_at === "string" ? sub.cancel_at : null;
  if (cancelAt) return "canceling";

  const today = new Date().toISOString().slice(0, 10);
  if (canceledDate && canceledDate > today) return "canceling";

  return mapped;
}

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

  const existingSubscriptionId = (profile as { subscription_id?: string | null } | null)?.subscription_id ?? null;
  const customerId = (profile as { square_customer_id?: string | null } | null)?.square_customer_id ?? null;

  try {
    let subscription: unknown = null;

    if (existingSubscriptionId) {
      const { result } = await squareClient.subscriptions.retrieve(existingSubscriptionId);
      subscription = (result as { subscription?: unknown }).subscription ?? null;
    } else if (customerId) {
      const filter: { customer_ids: string[]; location_ids?: string[] } = { customer_ids: [customerId] };
      if (process.env.SQUARE_LOCATION_ID) filter.location_ids = [process.env.SQUARE_LOCATION_ID];

      const { result } = await squareClient.subscriptions.search({
        query: { filter },
        sort: { field: "CREATED_AT", order: "DESC" },
      });

      const subs = (result as { subscriptions?: unknown[] }).subscriptions ?? [];
      subscription = subs[0] ?? null;
    }

    if (!subscription) {
      return NextResponse.json({
        subscription_status: (profile as { subscription_status?: string | null } | null)?.subscription_status ?? null,
        subscription_id: existingSubscriptionId,
        synced: false,
      });
    }

    const nextStatus = deriveDbStatusFromSubscription(subscription);
    const nextId = (subscription as { id?: unknown }).id;
    const nextSubscriptionId = typeof nextId === "string" ? nextId : existingSubscriptionId;

    await supabase
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
