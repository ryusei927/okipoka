import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { squareClient } from "@/lib/square";
import {
  deriveDbStatusFromSubscription,
  nextRenewalDateFrom,
  type DbSubscriptionStatus,
} from "@/lib/subscription";
import type { Square } from "square";
import { NextResponse } from "next/server";

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

  // 保護カラム(subscription_*)はservice role経由でのみ更新する
  const admin = createAdminClient();

  let subscriptionId = profile?.subscription_id ?? null;
  let status: DbSubscriptionStatus | string | null = profile?.subscription_status ?? null;
  let chargedThroughDate: string | null = null;
  let nextRenewalDate: string | null = null;

  async function syncFromSquareSubscription(subscription: Square.Subscription | null | undefined) {
    if (!subscription) return;

    chargedThroughDate = subscription.chargedThroughDate ?? null;
    nextRenewalDate = nextRenewalDateFrom(chargedThroughDate);

    const mapped = deriveDbStatusFromSubscription(subscription);
    if (mapped && mapped !== status) {
      status = mapped;
    }

    if (subscription.id && subscription.id !== subscriptionId) {
      subscriptionId = subscription.id;
    }

    if (subscriptionId) {
      await admin
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
      const { subscription } = await squareClient.subscriptions.get({ subscriptionId });
      await syncFromSquareSubscription(subscription);
    } else {
      // まれに「Square側では作成済みだが、DBにsubscription_idが保存されない」ケースがあるので再発見する
      const customerId = profile?.square_customer_id ?? null;
      if (customerId) {
        const filter: { customerIds: string[]; locationIds?: string[] } = {
          customerIds: [customerId],
        };
        if (process.env.SQUARE_LOCATION_ID) {
          filter.locationIds = [process.env.SQUARE_LOCATION_ID];
        }

        const { subscriptions } = await squareClient.subscriptions.search({
          query: { filter },
        });

        if (subscriptions && subscriptions.length > 0) {
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
