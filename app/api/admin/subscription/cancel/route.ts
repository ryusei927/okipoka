import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { squareClient } from "@/lib/square";
import {
  deriveDbStatusFromSubscription,
  isActiveLikeStatus,
  nextRenewalDateFrom,
} from "@/lib/subscription";
import { NextResponse } from "next/server";

const ADMIN_EMAIL = (process.env.OKIPOKA_ADMIN_EMAIL ?? "okipoka.jp@gmail.com").toLowerCase();

export async function POST(request: Request) {
  // 管理者認証チェック
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || (user.email ?? "").toLowerCase() !== ADMIN_EMAIL) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as { userId?: unknown } | null;
  const userId = typeof body?.userId === "string" ? body.userId : null;

  if (!userId) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }

  const admin = createAdminClient();

  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("id, subscription_id, subscription_status, square_customer_id")
    .eq("id", userId)
    .single();

  if (profileError || !profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  // すでに解約済み/解約予定ならそのまま返す
  if (profile.subscription_status === "canceling" || profile.subscription_status === "canceled") {
    return NextResponse.json({ success: true, status: profile.subscription_status });
  }

  // Square側のサブスクIDを特定（DBに無ければCustomer IDから探索）
  let subscriptionId = (profile as { subscription_id?: string | null }).subscription_id ?? null;
  const customerId = (profile as { square_customer_id?: string | null }).square_customer_id ?? null;

  if (!subscriptionId && customerId) {
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
        await admin.from("profiles").update({ subscription_id: subscriptionId }).eq("id", profile.id);
      }
    } catch {
      // 探索に失敗しても下のエラーへ
    }
  }

  if (!subscriptionId) {
    return NextResponse.json({ error: "Square側のサブスクが見つかりませんでした" }, { status: 400 });
  }

  try {
    // 既にSquare側で解約予約済みのケースを先に判定
    try {
      const { subscription } = await squareClient.subscriptions.get({ subscriptionId });
      const derived = deriveDbStatusFromSubscription(subscription);
      const chargedThroughDate = subscription?.chargedThroughDate ?? null;
      const nextRenewalDate = nextRenewalDateFrom(chargedThroughDate);

      if (derived === "canceling" || derived === "canceled") {
        await admin.from("profiles").update({ subscription_status: derived }).eq("id", profile.id);
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
      .eq("id", profile.id);

    if (updateError) {
      return NextResponse.json({ error: "ステータスの更新に失敗しました" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      status: nextStatus,
      charged_through_date: chargedThroughDate,
      next_renewal_date: nextRenewalDate,
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Cancel failed";
    // Squareが「既に解約予約あり」と返す場合はcanceling扱いに寄せる
    if (message.includes("already has a pending cancel date")) {
      await admin.from("profiles").update({ subscription_status: "canceling" }).eq("id", profile.id);
      return NextResponse.json({ success: true, status: "canceling" });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
