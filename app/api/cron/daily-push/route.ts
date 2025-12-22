import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import webpush from "web-push";

// 管理者権限でSupabaseを操作
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

export async function GET(request: Request) {
  // Vercel Cronからのリクエストであることを検証（本番環境では必須）
  // const authHeader = request.headers.get('authorization');
  // if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
  //   return new Response('Unauthorized', { status: 401 });
  // }

  try {
    const results = {
      gacha: 0,
      coupon: 0,
      tournament: 0,
      errors: [] as string[],
    };

    // 1. ガチャ通知 (毎日1回、まだ回していない人へ)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    // まず対象ユーザーを取得
    const { data: gachaUsers, error: gachaUserError } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .or(`last_gacha_at.lt.${yesterday.toISOString()},last_gacha_at.is.null`);

    if (gachaUserError) {
      console.error("Gacha user fetch error:", gachaUserError);
      results.errors.push(`Gacha user error: ${gachaUserError.message}`);
    } else if (gachaUsers && gachaUsers.length > 0) {
      const userIds = gachaUsers.map(u => u.id);
      
      // サブスクリプションを取得
      const { data: subs, error: subError } = await supabaseAdmin
        .from("push_subscriptions")
        .select("*")
        .in("user_id", userIds);

      if (subError) {
        console.error("Subscription fetch error:", subError);
      } else if (subs) {
        const payload = JSON.stringify({
          title: "ガチャが回せます！",
          body: "本日のガチャをまだ回していません。今すぐチェック！",
          url: "/member/gacha",
        });

        for (const sub of subs) {
          try {
            await webpush.sendNotification(
              {
                endpoint: sub.endpoint,
                keys: { p256dh: sub.p256dh, auth: sub.auth },
              },
              payload
            );
            results.gacha++;
          } catch (e) {
            console.error("Push send error:", e);
          }
        }
      }
    }

    // 2. クーポン期限切れ通知
    const now = new Date();
    const threeDaysLater = new Date();
    threeDaysLater.setDate(now.getDate() + 3);

    const { data: couponItems, error: couponError } = await supabaseAdmin
      .from("user_items")
      .select(`
        user_id,
        expires_at,
        gacha_items (name)
      `)
      .eq("is_used", false)
      .gt("expires_at", now.toISOString())
      .lt("expires_at", threeDaysLater.toISOString());

    if (couponError) {
      console.error("Coupon fetch error:", couponError);
      results.errors.push(`Coupon error: ${couponError.message}`);
    } else if (couponItems && couponItems.length > 0) {
      // ユーザーごとにアイテムをまとめるマップを作成
      const userItemsMap = new Map<string, string[]>();
      couponItems.forEach(item => {
        const items = userItemsMap.get(item.user_id) || [];
        // @ts-ignore
        items.push(item.gacha_items?.name || "アイテム");
        userItemsMap.set(item.user_id, items);
      });

      // サブスクリプション取得
      const userIds = Array.from(userItemsMap.keys());
      const { data: subs } = await supabaseAdmin
        .from("push_subscriptions")
        .select("*")
        .in("user_id", userIds);

      if (subs) {
        for (const sub of subs) {
          const items = userItemsMap.get(sub.user_id);
          if (!items) continue;

          const payload = JSON.stringify({
            title: "有効期限が近づいています",
            body: `「${items[0]}」${items.length > 1 ? `など${items.length}件` : ""}の有効期限が迫っています。`,
            url: "/member/items",
          });

          try {
            await webpush.sendNotification(
              {
                endpoint: sub.endpoint,
                keys: { p256dh: sub.p256dh, auth: sub.auth },
              },
              payload
            );
            results.coupon++;
          } catch (e) {
            console.error("Push send error:", e);
          }
        }
      }
    }

    // 3. トーナメント開催通知
    // -> 毎時実行の /api/cron/hourly-push に移動しました
    
    return NextResponse.json({ success: true, results });
  } catch (error: any) {
    console.error("Cron error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
