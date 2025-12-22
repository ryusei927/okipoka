import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import webpush from "web-push";

// 管理者権限でSupabaseを操作するため、直接環境変数を参照してクライアントを作成
// 注意: 本番環境では環境変数が正しく設定されていることを確認してください
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

if (
  process.env.NEXT_PUBLIC_VAPID_SUBJECT &&
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY &&
  process.env.VAPID_PRIVATE_KEY
) {
  webpush.setVapidDetails(
    process.env.NEXT_PUBLIC_VAPID_SUBJECT,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

export async function POST(request: Request) {
  const { userId, title, body, url } = await request.json();

  if (!userId || !title || !body) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // ユーザーの購読情報を取得
  const { data: subscriptions, error } = await supabaseAdmin
    .from("push_subscriptions")
    .select("*")
    .eq("user_id", userId);

  if (error || !subscriptions || subscriptions.length === 0) {
    return NextResponse.json({ error: "No subscriptions found" }, { status: 404 });
  }

  const results = [];

  for (const sub of subscriptions) {
    const pushSubscription = {
      endpoint: sub.endpoint,
      keys: {
        p256dh: sub.p256dh,
        auth: sub.auth,
      },
    };

    try {
      await webpush.sendNotification(
        pushSubscription,
        JSON.stringify({ title, body, url })
      );
      results.push({ status: "success", endpoint: sub.endpoint });
    } catch (err) {
      console.error("Error sending push notification:", err);
      results.push({ status: "error", endpoint: sub.endpoint, error: err });
      
      // エラーが410 (Gone) または 404 (Not Found) の場合、購読が無効になっているので削除する
      // @ts-ignore
      if (err.statusCode === 410 || err.statusCode === 404) {
        await supabaseAdmin
          .from("push_subscriptions")
          .delete()
          .eq("id", sub.id);
      }
    }
  }

  return NextResponse.json({ results });
}
