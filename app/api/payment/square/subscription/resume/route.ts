import { createClient } from "@/lib/supabase/server";
import { squareClient } from "@/lib/square";
import { NextResponse } from "next/server";

function addDays(ymd: string, days: number) {
  const [y, m, d] = ymd.split("-").map((v) => Number(v));
  const date = new Date(Date.UTC(y, m - 1, d));
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

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

  let subscriptionId = profile?.subscription_id ?? null;
  if (!subscriptionId) {
    // DBにsubscription_idが無いケースを救済（Square側から再発見）
    const customerId = profile?.square_customer_id ?? null;
    if (customerId) {
      try {
        const filter: { customer_ids: string[]; location_ids?: string[] } = { customer_ids: [customerId] };
        if (process.env.SQUARE_LOCATION_ID) filter.location_ids = [process.env.SQUARE_LOCATION_ID];

        const { result } = await squareClient.subscriptions.search({
          query: { filter },
          sort: { field: "CREATED_AT", order: "DESC" },
        });

        const subs = (result as { subscriptions?: unknown[] }).subscriptions ?? [];
        const candidate = subs.find((s) => {
          const sub = s as { status?: unknown };
          const status = typeof sub.status === "string" ? sub.status : null;
          return status === "ACTIVE" || status === "CANCELING" || status === "PAST_DUE";
        });

        const id = (candidate as { id?: unknown } | undefined)?.id;
        subscriptionId = typeof id === "string" ? id : null;
        if (subscriptionId) {
          await supabase
            .from("profiles")
            .update({ subscription_id: subscriptionId })
            .eq("id", user.id);
        }
      } catch {
        // 失敗しても通常エラーへ
      }
    }

    if (!subscriptionId) {
      return NextResponse.json({ error: "No subscription" }, { status: 400 });
    }
  }

  try {
    // 解約取り消し（キャンセル予約の解除）は Update subscription で canceled_date を null にする
    const { result: retrieveResult } = await squareClient.subscriptions.retrieve(subscriptionId);
    const current = retrieveResult.subscription;
    const currentVersion = current?.version;

    if (!currentVersion) {
      return NextResponse.json({ error: "Failed to load subscription version" }, { status: 500 });
    }

    // canceled_date が無ければ既に有効扱い
    const canceledDate = (current?.canceled_date as string | undefined) ?? null;
    if (!canceledDate) {
      const chargedThroughDate = (current?.charged_through_date as string | undefined) ?? null;
      const nextRenewalDate = chargedThroughDate ? addDays(chargedThroughDate, 1) : null;

      await supabase
        .from("profiles")
        .update({ subscription_status: "active" })
        .eq("id", user.id);

      return NextResponse.json({
        success: true,
        status: "active",
        charged_through_date: chargedThroughDate,
        next_renewal_date: nextRenewalDate,
      });
    }

    const { result } = await squareClient.subscriptions.update(subscriptionId, {
      subscription: {
        version: currentVersion,
        canceled_date: null,
      },
    });

    const statusFromSquare = result.subscription?.status as string | undefined;
    const chargedThroughDate = (result.subscription?.charged_through_date as string | undefined) ?? null;
    const nextRenewalDate = chargedThroughDate ? addDays(chargedThroughDate, 1) : null;

    const mapped = mapSquareStatusToDb(statusFromSquare) ?? "active";

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ subscription_status: mapped })
      .eq("id", user.id);

    if (updateError) {
      return NextResponse.json({ error: "Failed to update subscription status" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      status: mapped,
      charged_through_date: chargedThroughDate,
      next_renewal_date: nextRenewalDate,
    });
  } catch (e: unknown) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Resume failed" },
      { status: 500 }
    );
  }
}
