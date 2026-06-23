import { createAdminClient } from "@/lib/supabase/admin";
import { squareClient, getAdPlanVariationId } from "@/lib/square";
import { isActiveLikeStatus, mapSquareStatusToDb, toJsonSafe } from "@/lib/subscription";
import { NextResponse } from "next/server";
import { randomUUID } from "crypto";

type Body = {
  sourceId?: unknown;
  businessName?: unknown;
  contactName?: unknown;
  email?: unknown;
  phone?: unknown;
  note?: unknown;
};

function str(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as Body;

  const sourceId = str(body.sourceId);
  const businessName = str(body.businessName);
  const contactName = str(body.contactName);
  const email = str(body.email);
  const phone = str(body.phone);
  const note = str(body.note);

  if (!businessName) {
    return NextResponse.json({ error: "事業者名・店舗名を入力してください。" }, { status: 400 });
  }
  if (!email || !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "正しいメールアドレスを入力してください。" }, { status: 400 });
  }
  if (!sourceId) {
    return NextResponse.json({ error: "カード情報が取得できませんでした。" }, { status: 400 });
  }

  try {
    // 1. メールで既存の顧客を検索し、無ければ作成（二重作成を避ける）
    let customerId: string | undefined;
    try {
      const { customers } = await squareClient.customers.search({
        query: { filter: { emailAddress: { exact: email } } },
      });
      customerId = customers?.[0]?.id;
    } catch {
      // 検索に失敗しても作成フローへ
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

    // 2. 同じ顧客に有効な広告サブスクが既にあれば、それを採用して二重課金を避ける
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
        return NextResponse.json(
          toJsonSafe({ success: true, subscription: candidate, reused: true })
        );
      }
    } catch {
      // search が失敗しても処理は継続
    }

    // 3. カードを顧客に保存
    const { card } = await squareClient.cards.create({
      idempotencyKey: randomUUID(),
      sourceId,
      card: { customerId },
    });
    const cardId = card?.id;
    if (!cardId) throw new Error("Failed to save card");

    // 4. サブスクリプションを作成
    if (!process.env.SQUARE_LOCATION_ID) {
      return NextResponse.json(
        { error: "SQUARE_LOCATION_ID is missing in environment variables" },
        { status: 500 }
      );
    }

    const today = new Date().toISOString().slice(0, 10);

    const { subscription } = await squareClient.subscriptions.create({
      // 同じカード/顧客で同日に連打しても二重作成しない
      idempotencyKey: `ad:${customerId}:${planVariationId}:${today}`,
      locationId: process.env.SQUARE_LOCATION_ID,
      planVariationId,
      customerId,
      cardId,
      startDate: today,
    });

    const dbStatus = mapSquareStatusToDb(subscription?.status);

    // 5. 申込者をDBに記録（記録失敗は決済を妨げない）
    try {
      const admin = createAdminClient();
      await admin.from("ad_subscriptions").insert({
        business_name: businessName,
        contact_name: contactName,
        email,
        phone,
        note,
        square_customer_id: customerId,
        square_subscription_id: subscription?.id ?? null,
        subscription_status: dbStatus,
      });
    } catch (e) {
      console.error("Failed to record ad subscription:", e);
    }

    return NextResponse.json(toJsonSafe({ success: true, subscription }));
  } catch (error: unknown) {
    console.error("Square ad subscription error:", error);
    const message = error instanceof Error ? error.message : "Payment failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
