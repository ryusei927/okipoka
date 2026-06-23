import { createAdminClient } from "@/lib/supabase/admin";
import { squareClient, getAdPlanVariationId } from "@/lib/square";
import { isActiveLikeStatus, mapSquareStatusToDb, toJsonSafe } from "@/lib/subscription";
import { NextResponse } from "next/server";
import { randomUUID } from "crypto";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Body = {
  sourceId?: unknown;
  businessName?: unknown;
  contactName?: unknown;
  email?: unknown;
  phone?: unknown;
  note?: unknown;
  linkUrl?: unknown;
  adType?: unknown;
};

function str(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as Body;

  const sourceId = str(body.sourceId);
  const businessName = str(body.businessName);
  const contactName = str(body.contactName);
  const email = str(body.email);
  const phone = str(body.phone);
  const note = str(body.note);
  const linkUrl = str(body.linkUrl);
  const adType = body.adType === "square" ? "square" : "banner";

  if (!businessName) {
    return NextResponse.json({ error: "事業者名・店舗名を入力してください。" }, { status: 400 });
  }
  if (!email || !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "正しいメールアドレスを入力してください。" }, { status: 400 });
  }
  if (!sourceId) {
    return NextResponse.json({ error: "カード情報が取得できませんでした。" }, { status: 400 });
  }

  const admin = createAdminClient();

  try {
    // 1. メールで既存顧客を検索、無ければ作成（重複防止）
    let customerId: string | undefined;
    try {
      const { customers } = await squareClient.customers.search({
        query: { filter: { emailAddress: { exact: email } } },
      });
      customerId = customers?.[0]?.id;
    } catch {
      // 検索失敗時は作成フローへ
    }

    if (!customerId) {
      const { customer } = await squareClient.customers.create({
        idempotencyKey: randomUUID(),
        emailAddress: email,
        companyName: businessName,
        givenName: contactName ?? undefined,
        phoneNumber: phone ?? undefined,
        note: note ?? undefined,
      });
      customerId = customer?.id;
      if (!customerId) throw new Error("Failed to create Square customer");
    }

    const planVariationId = await getAdPlanVariationId();

    // 2. 既存の有効な広告サブスクがあれば二重課金を避ける
    let subscription:
      | Awaited<ReturnType<typeof squareClient.subscriptions.create>>["subscription"]
      | undefined;
    let reused = false;

    try {
      const filter: { customerIds: string[]; locationIds?: string[] } = {
        customerIds: [customerId],
      };
      if (process.env.SQUARE_LOCATION_ID) {
        filter.locationIds = [process.env.SQUARE_LOCATION_ID];
      }
      const { subscriptions } = await squareClient.subscriptions.search({
        query: { filter },
      });
      const candidate = (subscriptions ?? []).find(
        (sub) => isActiveLikeStatus(sub.status) && sub.planVariationId === planVariationId
      );
      if (candidate) {
        subscription = candidate;
        reused = true;
      }
    } catch {
      // search失敗時は通常フローへ
    }

    // 3. 新規サブスク作成（既存が無い場合のみ）
    if (!subscription) {
      const { card } = await squareClient.cards.create({
        idempotencyKey: randomUUID(),
        sourceId,
        card: { customerId },
      });
      const cardId = card?.id;
      if (!cardId) throw new Error("Failed to save card");

      if (!process.env.SQUARE_LOCATION_ID) {
        return NextResponse.json(
          { error: "SQUARE_LOCATION_ID is missing in environment variables" },
          { status: 500 }
        );
      }

      const today = new Date().toISOString().slice(0, 10);
      const created = await squareClient.subscriptions.create({
        idempotencyKey: `ad:${customerId}:${planVariationId}:${today}`,
        locationId: process.env.SQUARE_LOCATION_ID,
        planVariationId,
        customerId,
        cardId,
        startDate: today,
      });
      subscription = created.subscription;
    }

    const dbStatus = mapSquareStatusToDb(subscription?.status);

    // 4. 申込内容を保存（広告画像は運営が後から管理画面で登録・紐づける）
    try {
      await admin.from("ad_subscriptions").insert({
        business_name: businessName,
        contact_name: contactName,
        email,
        phone,
        note,
        link_url: linkUrl,
        desired_ad_type: adType,
        square_customer_id: customerId,
        square_subscription_id: subscription?.id ?? null,
        subscription_status: dbStatus,
      });
    } catch (e) {
      console.error("Failed to record ad subscription:", e);
    }

    return NextResponse.json(toJsonSafe({ success: true, subscription, reused }));
  } catch (error: unknown) {
    console.error("Square ad subscription error:", error);
    const message = error instanceof Error ? error.message : "Payment failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
