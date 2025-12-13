import { createHmac, timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

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

function verifySquareSignature(rawBody: string, signature: string) {
  const signatureKey = process.env.SQUARE_WEBHOOK_SIGNATURE_KEY;
  const notificationUrl = process.env.SQUARE_WEBHOOK_NOTIFICATION_URL;

  if (!signatureKey || !notificationUrl) {
    throw new Error("Square webhook is not configured (missing SQUARE_WEBHOOK_SIGNATURE_KEY or SQUARE_WEBHOOK_NOTIFICATION_URL)");
  }

  const expected = createHmac("sha256", signatureKey)
    .update(notificationUrl + rawBody)
    .digest("base64");

  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signatureHeader = request.headers.get("x-square-hmacsha256-signature") ?? "";

  try {
    const ok = verifySquareSignature(rawBody, signatureHeader);
    if (!ok) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Webhook not configured";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  let payload: unknown;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const event = payload as {
    type?: unknown;
    data?: {
      object?: {
        subscription?: unknown;
      };
    };
  };

  const subscription = event.data?.object?.subscription ?? null;
  if (!subscription) {
    // 受け取ったが処理対象外（将来イベントを増やしてもOK）
    return NextResponse.json({ ok: true, handled: false });
  }

  const sub = subscription as { id?: unknown; customer_id?: unknown };
  const subscriptionId = typeof sub.id === "string" ? sub.id : null;
  const customerId = typeof sub.customer_id === "string" ? sub.customer_id : null;
  const nextStatus = deriveDbStatusFromSubscription(subscription);

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
