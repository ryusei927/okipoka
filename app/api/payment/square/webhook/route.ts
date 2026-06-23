import { NextResponse } from "next/server";
import { WebhooksHelper } from "square";
import { createAdminClient } from "@/lib/supabase/admin";
import { deriveDbStatusFromSubscription } from "@/lib/subscription";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signatureHeader = request.headers.get("x-square-hmacsha256-signature") ?? "";

  const signatureKey = process.env.SQUARE_WEBHOOK_SIGNATURE_KEY;
  const notificationUrl = process.env.SQUARE_WEBHOOK_NOTIFICATION_URL;

  if (!signatureKey || !notificationUrl) {
    return NextResponse.json(
      {
        error:
          "Square webhook is not configured (missing SQUARE_WEBHOOK_SIGNATURE_KEY or SQUARE_WEBHOOK_NOTIFICATION_URL)",
      },
      { status: 500 }
    );
  }

  const isValid = await WebhooksHelper.verifySignature({
    requestBody: rawBody,
    signatureHeader,
    signatureKey,
    notificationUrl,
  });

  if (!isValid) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let payload: unknown;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Webhook の本文は Square の生 JSON（snake_case）であることに注意。
  const event = payload as {
    type?: unknown;
    data?: {
      object?: {
        subscription?: {
          id?: unknown;
          customer_id?: unknown;
          status?: unknown;
          canceled_date?: unknown;
        };
      };
    };
  };

  const subscription = event.data?.object?.subscription ?? null;
  if (!subscription) {
    // 受け取ったが処理対象外（将来イベントを増やしてもOK）
    return NextResponse.json({ ok: true, handled: false });
  }

  const subscriptionId = typeof subscription.id === "string" ? subscription.id : null;
  const customerId = typeof subscription.customer_id === "string" ? subscription.customer_id : null;

  // 共通ロジックは camelCase を前提とするため、必要なフィールドだけ変換して渡す
  const nextStatus = deriveDbStatusFromSubscription({
    status: typeof subscription.status === "string" ? subscription.status : undefined,
    canceledDate: typeof subscription.canceled_date === "string" ? subscription.canceled_date : null,
  });

  if (!customerId) {
    return NextResponse.json({ ok: true, handled: false });
  }

  const admin = createAdminClient();

  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("id, subscription_id, subscription_status")
    .eq("square_customer_id", customerId)
    .maybeSingle();

  if (profileError) {
    return NextResponse.json({ error: "Failed to read profile" }, { status: 500 });
  }

  if (!profile) {
    // まだprofilesに紐づけてない顧客など
    return NextResponse.json({ ok: true, handled: true, updated: false });
  }

  const updates: { subscription_id?: string | null; subscription_status?: string | null } = {};
  if (subscriptionId && profile.subscription_id !== subscriptionId) {
    updates.subscription_id = subscriptionId;
  }
  if (nextStatus && profile.subscription_status !== nextStatus) {
    updates.subscription_status = nextStatus;
  }

  if (Object.keys(updates).length > 0) {
    const { error: updateError } = await admin.from("profiles").update(updates).eq("id", profile.id);
    if (updateError) {
      return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true, handled: true, updated: Object.keys(updates).length > 0 });
}
