import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { squareClient } from "@/lib/square";
import { deriveDbStatusFromSubscription } from "@/lib/subscription";
import type { Square } from "square";
import { NextResponse } from "next/server";

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const email = (user.email ?? "").toLowerCase();
  const adminEmail = (process.env.OKIPOKA_ADMIN_EMAIL ?? "okipoka.jp@gmail.com").toLowerCase();
  const isAdmin = email === adminEmail;

  // まずDBの状態を取得（以降のSquare同期にも使う）
  const { data: profileBase } = await supabase
    .from("profiles")
    .select("subscription_status, subscription_id, square_customer_id, payment_method, subscription_expires_at")
    .eq("id", user.id)
    .single();

  // 現金払いユーザーはSquareチェックをスキップ
  const paymentMethod = (profileBase as { payment_method?: string | null } | null)?.payment_method ?? null;
  if (paymentMethod === "cash") {
    // 現金会員は subscription_expires_at を過ぎたらここでブロックする。
    // （DB側の自動失効に依存せず、APIレベルでも期限を必ず評価する）
    const expiresAt =
      (profileBase as { subscription_expires_at?: string | null } | null)?.subscription_expires_at ?? null;
    const todayJst = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Tokyo" }); // YYYY-MM-DD
    const expiresStr = typeof expiresAt === "string" ? expiresAt.slice(0, 10) : null;

    if (expiresStr && expiresStr < todayJst) {
      // 期限切れ → ステータスを自動で canceled に落として以後もブロック
      try {
        const admin = createAdminClient();
        await admin
          .from("profiles")
          .update({
            subscription_status: "canceled",
            payment_method: null,
            subscription_expires_at: null,
          })
          .eq("id", user.id);
      } catch {
        // 失効更新に失敗してもブロックは行う
      }
      return NextResponse.json({ error: "Subscription expired" }, { status: 403 });
    }
    // 期限内なら spin_gacha に進む
  } else {
    // 「支払い済みなのにsubscription_status/subscription_idがDBに反映されていない」ケースを救済する
    try {
    const currentStatus = (profileBase as { subscription_status?: string | null } | null)?.subscription_status ?? null;
    const subscriptionId = (profileBase as { subscription_id?: string | null } | null)?.subscription_id ?? null;
    const customerId = (profileBase as { square_customer_id?: string | null } | null)?.square_customer_id ?? null;

    // できるなら毎回Squareの最新状態を取りに行く（1日1回のAPIなので許容）
    // 失敗した場合はDBの状態で続行（誤ブロックを避ける）
    let subscription: Square.Subscription | null = null;
    if (subscriptionId) {
      const { subscription: sub } = await squareClient.subscriptions.get({ subscriptionId });
      subscription = sub ?? null;
    } else if (customerId) {
      const filter: { customerIds: string[]; locationIds?: string[] } = {
        customerIds: [customerId],
      };
      if (process.env.SQUARE_LOCATION_ID) filter.locationIds = [process.env.SQUARE_LOCATION_ID];
      const { subscriptions } = await squareClient.subscriptions.search({
        query: { filter },
      });
      subscription = subscriptions?.[0] ?? null;
    }

    if (subscription) {
      const nextStatus = deriveDbStatusFromSubscription(subscription);
      const nextSubscriptionId = subscription.id ?? null;

      if (nextSubscriptionId || nextStatus) {
        // 保護カラムはservice role経由で更新する
        const admin = createAdminClient();
        await admin
          .from("profiles")
          .update({
            subscription_id: nextSubscriptionId ?? subscriptionId,
            subscription_status: nextStatus,
          })
          .eq("id", user.id);
      }

      // Squareで非有効になっていたら、ここで止める（Webhook遅延・取りこぼし対策）
      if (nextStatus && nextStatus !== "active" && nextStatus !== "canceling") {
        return NextResponse.json({ error: "Subscription required" }, { status: 403 });
      }
    } else if (currentStatus !== "active" && currentStatus !== "canceling") {
      // Squareから取れず、DBでも非有効なら従来どおりブロック
      return NextResponse.json({ error: "Subscription required" }, { status: 403 });
    }
  } catch {
    // 救済同期が失敗してもRPCで判定させる
  }
  }

  const { data, error } = await supabase.rpc("spin_gacha");
  if (error) {
    const msg = error.message || "Failed";
    if (msg.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (msg.includes("Subscription expired")) {
      return NextResponse.json({ error: "Subscription expired" }, { status: 403 });
    }
    if (msg.includes("Subscription required")) {
      return NextResponse.json({ error: "Subscription required" }, { status: 403 });
    }
    if (msg.includes("Already played today")) {
      return NextResponse.json({ error: "Already played today" }, { status: 400 });
    }
    if (msg.includes("No items available")) {
      return NextResponse.json({ error: "No items available" }, { status: 500 });
    }
    console.error("spin_gacha rpc error:", error);

    // 運営アカウントは原因特定できるよう詳細を返す（一般ユーザーには出さない）
    if (isAdmin) {
      return NextResponse.json(
        {
          error: msg,
          debug: {
            code: (error as unknown as { code?: unknown }).code,
            details: (error as unknown as { details?: unknown }).details,
            hint: (error as unknown as { hint?: unknown }).hint,
          },
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ error: "Failed to spin" }, { status: 500 });
  }

  // 店舗画像を取得して付与
  const itemData: Record<string, unknown> = { ...data };
  if (data && data.shop_id) {
    const { data: shop } = await supabase
      .from("shops")
      .select("image_url")
      .eq("id", data.shop_id)
      .single();

    if (shop) {
      itemData.shop_image_url = shop.image_url;
    }
  }

  return NextResponse.json({ success: true, item: itemData });
}
