import { createClient } from "@/lib/supabase/server";
import { squareClient, getSubscriptionPlanVariationId } from "@/lib/square";
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
      .select("square_customer_id, email")
      .eq("id", user.id)
      .single();

    let customerId = profile?.square_customer_id;

    if (!customerId) {
      const { result: customerResult } = await squareClient.customers.create({
        idempotency_key: randomUUID(),
        email_address: user.email,
        reference_id: user.id,
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
    const { result: cardResult } = await squareClient.cards.create({
      idempotency_key: randomUUID(),
      source_id: sourceId,
      card: {
        customer_id: customerId,
      },
    });

    const cardId = cardResult.card?.id;
    if (!cardId) throw new Error("Failed to save card");

    // 3. サブスクリプションを作成
    if (!process.env.SQUARE_LOCATION_ID) {
      return NextResponse.json(
        { error: "SQUARE_LOCATION_ID is missing in environment variables" },
        { status: 500 }
      );
    }

    const planVariationId = await getSubscriptionPlanVariationId();

    const { result: subscriptionResult } = await squareClient.subscriptions.create({
      idempotency_key: randomUUID(),
      location_id: process.env.SQUARE_LOCATION_ID!, // .envから取得
      plan_variation_id: planVariationId,
      customer_id: customerId,
      card_id: cardId,
      start_date: new Date().toISOString().slice(0, 10),
    });

    const subscription = subscriptionResult.subscription;

    // 4. DBの状態を更新
    await supabase
      .from("profiles")
      .update({
        subscription_id: subscription?.id,
        subscription_status: 'active',
      })
      .eq("id", user.id);

    // BigIntをシリアライズできるように変換
    const responseData = JSON.parse(JSON.stringify({ success: true, subscription }, (key, value) =>
      typeof value === "bigint" ? value.toString() : value
    ));

    return NextResponse.json(responseData);

  } catch (error: any) {
    console.error("Square subscription error:", error);
    // JSON.stringifyできないBigIntなどが含まれる可能性があるため、エラーメッセージだけ返す
    return NextResponse.json(
      { error: error.message || "Payment failed" },
      { status: 500 }
    );
  }
}
