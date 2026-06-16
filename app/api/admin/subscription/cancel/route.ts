import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { squareClient } from "@/lib/square";
import { NextResponse } from "next/server";

const ADMIN_EMAIL = (process.env.OKIPOKA_ADMIN_EMAIL ?? "okipoka.jp@gmail.com").toLowerCase();

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

  const canceledDate = typeof sub.canceled_date === "string" ? sub.canceled_date : null;
  const cancelAt = typeof sub.cancel_at === "string" ? sub.cancel_at : null;
  if (cancelAt) return "canceling";
  const today = new Date().toISOString().slice(0, 10);
  if (canceledDate && canceledDate > today) return "canceling";

  return "active";
}

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
      const filter: { customer_ids: string[]; location_ids?: string[] } = { customer_ids: [customerId] };
      if (process.env.SQUARE_LOCATION_ID) filter.location_ids = [process.env.SQUARE_LOCATION_ID];

      const { result } = await squareClient.subscriptions.search({
        query: { filter },
        sort: { field: "CREATED_AT", order: "DESC" },
      });

      const subs = (result as { subscriptions?: unknown[] }).subscriptions ?? [];
      const candidate = subs.find((s) => {
        const status = (s as { status?: unknown }).status;
        return status === "ACTIVE" || status === "CANCELING" || status === "PAST_DUE";
      });
      const id = (candidate as { id?: unknown } | undefined)?.id;
      subscriptionId = typeof id === "string" ? id : null;

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
      const { result: retrieveResult } = await squareClient.subscriptions.retrieve(subscriptionId);
      const subscription = retrieveResult.subscription;
      const derived = deriveDbStatusFromSubscription(subscription);
      const chargedThroughDate = (subscription?.charged_through_date as string | undefined) ?? null;
      const nextRenewalDate = chargedThroughDate ? addDays(chargedThroughDate, 1) : null;

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

    const { result } = await squareClient.subscriptions.cancel(subscriptionId);
    const statusFromSquare = result.subscription?.status as string | undefined;
    const chargedThroughDate = (result.subscription?.charged_through_date as string | undefined) ?? null;
    const nextRenewalDate = chargedThroughDate ? addDays(chargedThroughDate, 1) : null;

    const nextStatus = statusFromSquare === "CANCELED" ? "canceled" : "canceling";

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
