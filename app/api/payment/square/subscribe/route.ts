import { createClient } from "@/lib/supabase/server";
import { squareClient, getOrCreateSubscriptionPlan } from "@/lib/square";
import { NextResponse } from "next/server";
import { randomUUID } from "crypto";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { sourceId } = body; // Square Web Payments SDKから取得したカードトークン

  if (!sourceId) {
    return NextResponse.json({ error: "Card token is required" }, { status: 400 });
  }

  try {
    // 1. プロフィールからSquare Customer IDを取得、なければ作成
    const { data: profile } = await supabase
      .from("profiles")
      .select("square_customer_id, email, full_name") // full_nameなどがなければ適宜調整
      .eq("id", user.id)
      .single();

    let customerId = profile?.square_customer_id;

    if (!customerId) {
      const { result: customerResult } = await squareClient.customersApi.createCustomer({
        idempotencyKey: randomUUID(),
        emailAddress: user.email,
        referenceId: user.id,
      });
      customerId = customerResult.customer?.id;

      if (!customerId) throw new Error("Failed to create Square customer");

      // DBに保存
      await supabase
        .from("profiles")
        .update({ square_customer_id: customerId })
        .eq("id", user.id);
    }

    // 2. カードを顧客に保存
    const { result: cardResult } = await squareClient.cardsApi.createCard({
      idempotencyKey: randomUUID(),
      sourceId: sourceId,
      card: {
        customerId: customerId,
      },
    });

    const cardId = cardResult.card?.id;
    if (!cardId) throw new Error("Failed to save card");

    // 3. サブスクリプションを作成
    const planId = await getOrCreateSubscriptionPlan();
    if (!planId) {
      return NextResponse.json({ error: "Subscription plan not configured" }, { status: 500 });
    }

    const { result: subscriptionResult } = await squareClient.subscriptionsApi.createSubscription({
      idempotencyKey: randomUUID(),
      locationId: process.env.SQUARE_LOCATION_ID!,
      planId: planId,
      customerId: customerId,
      cardId: cardId,
    });

    const subscription = subscriptionResult.subscription;

    // 4. DBの状態を更新
    await supabase
      .from("profiles")
      .update({
        subscription_id: subscription?.id,
        subscription_status: 'active', // 本来はWebhookで管理すべきだが、簡易的にここで更新
      })
      .eq("id", user.id);

    return NextResponse.json({ success: true, subscription });

  } catch (error: any) {
    console.error("Square subscription error:", error);
    // JSON.stringifyできないBigIntなどが含まれる可能性があるため、エラーメッセージだけ返す
    return NextResponse.json(
      { error: error.message || "Payment failed" },
      { status: 500 }
    );
  }
}
