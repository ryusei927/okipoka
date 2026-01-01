import { createClient } from "@/lib/supabase/server";
import { squareClient } from "@/lib/square";
import { NextResponse } from "next/server";

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

  // 現金払いの場合、期限切れチェック
  const paymentMethod = (profileBase as { payment_method?: string | null } | null)?.payment_method ?? null;
  const expiresAt = (profileBase as { subscription_expires_at?: string | null } | null)?.subscription_expires_at ?? null;
  
  if (paymentMethod === "cash") {
    const today = new Date().toISOString().slice(0, 10);
    if (expiresAt && expiresAt < today) {
      // 期限切れ → ステータスを自動で canceled に更新
      await supabase
        .from("profiles")
        .update({ 
          subscription_status: "canceled",
          payment_method: null,
          subscription_expires_at: null,
        })
        .eq("id", user.id);
      
      return NextResponse.json({ error: "Subscription expired" }, { status: 403 });
    }
  }

  // 「支払い済みなのにsubscription_status/subscription_idがDBに反映されていない」ケースを救済する
  try {
    const currentStatus = (profileBase as { subscription_status?: string | null } | null)?.subscription_status ?? null;
    const subscriptionId = (profileBase as { subscription_id?: string | null } | null)?.subscription_id ?? null;
    const customerId = (profileBase as { square_customer_id?: string | null } | null)?.square_customer_id ?? null;

    // できるなら毎回Squareの最新状態を取りに行く（1日1回のAPIなので許容）
    // 失敗した場合はDBの状態で続行（誤ブロックを避ける）
    let subscription: unknown = null;
    if (subscriptionId) {
      const { result } = await squareClient.subscriptions.retrieve(subscriptionId);
      subscription = (result as { subscription?: unknown }).subscription ?? null;
    } else if (customerId) {
      const filter: { customer_ids: string[]; location_ids?: string[] } = { customer_ids: [customerId] };
      if (process.env.SQUARE_LOCATION_ID) filter.location_ids = [process.env.SQUARE_LOCATION_ID];
      const { result } = await squareClient.subscriptions.search({
        query: { filter },
        sort: { field: "CREATED_AT", order: "DESC" },
      });
      const subs = (result as { subscriptions?: unknown[] }).subscriptions ?? [];
      subscription = subs[0] ?? null;
    }

    if (subscription) {
      const nextStatus = deriveDbStatusFromSubscription(subscription);
      const nextId = (subscription as { id?: unknown }).id;
      const nextSubscriptionId = typeof nextId === "string" ? nextId : null;

      if (nextSubscriptionId || nextStatus) {
        await supabase
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

  const { data, error } = await supabase.rpc("spin_gacha");
  if (error) {
    const msg = error.message || "Failed";
    if (msg.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
  let itemData = { ...data };
  if (data && data.shop_id) {
    const { data: shop } = await supabase
      .from("shops")
      .select("image_url")
      .eq("id", data.shop_id)
      .single();
    
    if (shop) {
      // @ts-ignore
      itemData.shop_image_url = shop.image_url;
    }
  }

  return NextResponse.json({ success: true, item: itemData });
}
