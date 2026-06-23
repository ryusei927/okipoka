import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { squareClient } from "@/lib/square";
import { isActiveLikeStatus, mapSquareStatusToDb, nextRenewalDateFrom } from "@/lib/subscription";
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
      return NextResponse.json({ error: "No subscription" }, { status: 400 });
    }
  }

  try {
    // 解約取り消し（キャンセル予約の解除）は Update subscription で canceledDate を null にする
    const { subscription: current } = await squareClient.subscriptions.get({ subscriptionId });
    const currentVersion = current?.version;

    if (!currentVersion) {
      return NextResponse.json({ error: "Failed to load subscription version" }, { status: 500 });
    }

    // canceledDate が無ければ既に有効扱い
    const canceledDate = current?.canceledDate ?? null;
    if (!canceledDate) {
      const chargedThroughDate = current?.chargedThroughDate ?? null;
      const nextRenewalDate = nextRenewalDateFrom(chargedThroughDate);

      await admin
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

    const { subscription } = await squareClient.subscriptions.update({
      subscriptionId,
      subscription: {
        version: currentVersion,
        canceledDate: null,
      },
    });

    const chargedThroughDate = subscription?.chargedThroughDate ?? null;
    const nextRenewalDate = nextRenewalDateFrom(chargedThroughDate);

    const mapped = mapSquareStatusToDb(subscription?.status) ?? "active";

    const { error: updateError } = await admin
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
