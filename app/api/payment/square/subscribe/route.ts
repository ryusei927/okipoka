import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { squareClient, getSubscriptionPlanVariationId } from "@/lib/square";
import { isActiveLikeStatus, mapSquareStatusToDb, toJsonSafe } from "@/lib/subscription";
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

  // サブスク状態などの保護カラムはservice role経由でのみ更新する
  // （ブラウザからの直接書き換えはDBトリガーで拒否されるため）
  const admin = createAdminClient();

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
        const { subscription } = await squareClient.subscriptions.get({
          subscriptionId: existingSubscriptionId,
        });
        return NextResponse.json(
          toJsonSafe({
            success: true,
            subscription,
            reused: true,
          })
        );
      } catch {
        // 取得に失敗した場合は通常フローへ（後段でsearchも試す）
      }
    }

    if (!customerId) {
      const { customer } = await squareClient.customers.create({
        idempotencyKey: randomUUID(),
        emailAddress: user.email,
        referenceId: user.id,
      });
      customerId = customer?.id;

      if (!customerId) throw new Error("Failed to create Square customer");

      // DBに保存
      await admin
        .from("profiles")
        .update({ square_customer_id: customerId })
        .eq("id", user.id);
    }

    // planVariationId は「既存サブスクがあるか」の照合にも使う
    const planVariationId = await getSubscriptionPlanVariationId();

    // Square側に既存の有効/解約予約サブスクがあればそれを採用して二重作成を避ける
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

      const candidate = (subscriptions ?? []).find((sub) => {
        const planOk = sub.planVariationId ? sub.planVariationId === planVariationId : true;
        return isActiveLikeStatus(sub.status) && planOk;
      });

      if (candidate) {
        const dbStatus = mapSquareStatusToDb(candidate.status);

        if (candidate.id) {
          await admin
            .from("profiles")
            .update({ subscription_id: candidate.id, subscription_status: dbStatus })
            .eq("id", user.id);
        }

        return NextResponse.json(
          toJsonSafe({
            success: true,
            subscription: candidate,
            reused: true,
          })
        );
      }
    } catch {
      // searchが失敗しても決済は継続する
    }

    // 2. カードを顧客に保存
    if (!sourceId) {
      return NextResponse.json({ error: "Card token is required" }, { status: 400 });
    }
    const { card } = await squareClient.cards.create({
      idempotencyKey: randomUUID(),
      sourceId,
      card: {
        customerId,
      },
    });

    const cardId = card?.id;
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
      const { locations } = await squareClient.locations.list();
      const accessibleIds = (locations ?? [])
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

    // Square はロケーションのタイムゾーン（JST）で startDate を解釈するため、
    // UTC基準で日付を作ると JST 0〜9時に「開始日が過去」エラーになる。必ず JST で算出する。
    const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Tokyo" });

    const { subscription } = await squareClient.subscriptions.create({
      // 同一ユーザーが連打しても同じサブスクが返るようにする（同日に複数作成しない）
      idempotencyKey: `sub:${user.id}:${planVariationId}:${today}`,
      locationId: process.env.SQUARE_LOCATION_ID!, // .envから取得
      planVariationId,
      customerId,
      cardId,
      startDate: today,
    });

    const dbStatus = mapSquareStatusToDb(subscription?.status);

    // 4. DBの状態を更新
    const { error: updateError } = await admin
      .from("profiles")
      .update({
        subscription_id: subscription?.id,
        subscription_status: dbStatus,
      })
      .eq("id", user.id);

    if (updateError) {
      throw new Error(`Failed to update profile: ${updateError.message}`);
    }

    // bigint（subscription.version など）を含むためJSONセーフに変換して返す
    return NextResponse.json(toJsonSafe({ success: true, subscription }));
  } catch (error: unknown) {
    console.error("Square subscription error:", error);
    const message = error instanceof Error ? error.message : "Payment failed";
    // JSON.stringifyできないBigIntなどが含まれる可能性があるため、エラーメッセージだけ返す
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
