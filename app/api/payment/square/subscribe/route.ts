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

  const body = (await request.json().catch(() => ({}))) as { sourceId?: unknown };
  const sourceId = typeof body.sourceId === "string" ? body.sourceId : null; // Square Web Payments SDKから取得したカードトークン

  try {
    // 1. プロフィールからSquare Customer IDを取得、なければ作成
    const { data: profile } = await supabase
      .from("profiles")
      .select("square_customer_id, subscription_id, subscription_status")
      .eq("id", user.id)
      .single();

    let customerId = profile?.square_customer_id;

    // 既に有効なsubscriptionがDBにあるなら、まずSquareから再取得して二重作成を避ける
    const existingSubscriptionId = profile?.subscription_id ?? null;
    const existingStatus = profile?.subscription_status ?? null;
    if (existingSubscriptionId && (existingStatus === "active" || existingStatus === "canceling")) {
      try {
        const { result } = await squareClient.subscriptions.retrieve(existingSubscriptionId);
        const subscription = (result as { subscription?: unknown }).subscription;
        return NextResponse.json({
          success: true,
          subscription,
          reused: true,
        });
      } catch {
        // 取得に失敗した場合は通常フローへ（後段でsearchも試す）
      }
    }

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

    // planVariationId は「既存サブスクがあるか」の照合にも使う
    const planVariationId = await getSubscriptionPlanVariationId();

    // Square側に既存の有効/解約予約サブスクがあればそれを採用して二重作成を避ける
    try {
      const filter: { customer_ids: string[]; location_ids?: string[] } = { customer_ids: [customerId] };
      if (process.env.SQUARE_LOCATION_ID) {
        filter.location_ids = [process.env.SQUARE_LOCATION_ID];
      }

      const { result } = await squareClient.subscriptions.search({
        query: { filter },
        sort: { field: "CREATED_AT", order: "DESC" },
      });

      const subs = (result as { subscriptions?: unknown[] }).subscriptions ?? [];
      const candidate = subs.find((s) => {
        const sub = s as { status?: unknown; plan_variation_id?: unknown };
        const status = typeof sub.status === "string" ? sub.status : null;
        const pv = typeof sub.plan_variation_id === "string" ? sub.plan_variation_id : null;
        const statusOk = status === "ACTIVE" || status === "CANCELING" || status === "PAST_DUE";
        const planOk = pv ? pv === planVariationId : true;
        return statusOk && planOk;
      });

      if (candidate) {
        const sub = candidate as { id?: unknown; status?: unknown };
        const id = typeof sub.id === "string" ? sub.id : null;
        const status = typeof sub.status === "string" ? sub.status : null;
        const dbStatus =
          status === "ACTIVE"
            ? "active"
            : status === "CANCELING"
              ? "canceling"
              : status === "CANCELED"
                ? "canceled"
                : status === "PAST_DUE"
                  ? "past_due"
                  : null;

        if (id) {
          await supabase
            .from("profiles")
            .update({ subscription_id: id, subscription_status: dbStatus })
            .eq("id", user.id);
        }

        return NextResponse.json({
          success: true,
          subscription: candidate,
          reused: true,
        });
      }
    } catch {
      // searchが失敗しても決済は継続する
    }

    // 2. カードを顧客に保存
    if (!sourceId) {
      return NextResponse.json({ error: "Card token is required" }, { status: 400 });
    }
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

    // Location ID がトークンのマーチャントに紐づいているか事前検証（よくある設定ミス対策）
    try {
      const { result: locResult } = await squareClient.locations.list();
      const locations = (locResult as { locations?: Array<{ id?: unknown }> }).locations ?? [];
      const accessibleIds = locations
        .map((l) => l.id)
        .filter((id): id is string => typeof id === "string" && id.length > 0);
      if (accessibleIds.length > 0 && !accessibleIds.includes(process.env.SQUARE_LOCATION_ID)) {
        return NextResponse.json(
          {
            error: `SQUARE_LOCATION_ID (${process.env.SQUARE_LOCATION_ID}) is not accessible by the current SQUARE_ACCESS_TOKEN. Accessible location IDs: ${accessibleIds.join(", ")}`,
          },
          { status: 500 }
        );
      }
    } catch {
      // 一時的なネットワーク等で落ちても決済処理は継続する
    }

    const today = new Date().toISOString().slice(0, 10);

    const { result: subscriptionResult } = await squareClient.subscriptions.create({
      // 同一ユーザーが連打しても同じサブスクが返るようにする（同日に複数作成しない）
      idempotency_key: `sub:${user.id}:${planVariationId}:${today}`,
      location_id: process.env.SQUARE_LOCATION_ID!, // .envから取得
      plan_variation_id: planVariationId,
      customer_id: customerId,
      card_id: cardId,
      start_date: today,
    });

    const subscription = subscriptionResult.subscription;

    const squareStatus = (subscription as { status?: unknown } | undefined)?.status;
    const dbStatus =
      squareStatus === "ACTIVE"
        ? "active"
        : squareStatus === "CANCELING"
          ? "canceling"
          : squareStatus === "CANCELED"
            ? "canceled"
            : squareStatus === "PAST_DUE"
              ? "past_due"
              : null;

    // 4. DBの状態を更新
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        subscription_id: subscription?.id,
        subscription_status: dbStatus,
      })
      .eq("id", user.id);

    if (updateError) {
      throw new Error(`Failed to update profile: ${updateError.message}`);
    }

    // BigIntをシリアライズできるように変換
    const responseData = JSON.parse(JSON.stringify({ success: true, subscription }, (key, value) =>
      typeof value === "bigint" ? value.toString() : value
    ));

    return NextResponse.json(responseData);

  } catch (error: unknown) {
    console.error("Square subscription error:", error);
    const message = error instanceof Error ? error.message : "Payment failed";
    // JSON.stringifyできないBigIntなどが含まれる可能性があるため、エラーメッセージだけ返す
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
