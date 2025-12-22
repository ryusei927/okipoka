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
  try {
    const results = {
      tournament: 0,
      errors: [] as string[],
    };

    const now = new Date();
    // 2時間後までのトーナメントを対象にする
    const twoHoursLater = new Date(now.getTime() + 2 * 60 * 60 * 1000);

    // まだ通知していない(notified_at is null) かつ もうすぐ始まるトーナメントを取得
    const { data: favTournaments, error: tournamentError } = await supabaseAdmin
      .from("tournament_favorites")
      .select(`
        id,
        user_id,
        notified_at,
        tournaments!inner (
          id,
          title,
          start_at
        )
      `)
      .is("notified_at", null) // まだ通知していない
      .gt("tournaments.start_at", now.toISOString()) // 今より後
      .lt("tournaments.start_at", twoHoursLater.toISOString()); // 2時間以内

    if (tournamentError) {
      console.error("Tournament fetch error:", tournamentError);
      results.errors.push(`Tournament error: ${tournamentError.message}`);
    } else if (favTournaments && favTournaments.length > 0) {
      // ユーザーIDリスト作成
      const userIds = Array.from(new Set(favTournaments.map(f => f.user_id)));
      
      // サブスクリプション取得
      const { data: subs } = await supabaseAdmin
        .from("push_subscriptions")
        .select("*")
        .in("user_id", userIds);

      if (subs) {
        for (const fav of favTournaments) {
          // @ts-ignore
          const tournamentData = fav.tournaments;
          const tournament = Array.isArray(tournamentData) ? tournamentData[0] : tournamentData;

          if (!tournament) continue;

          const userSubs = subs.filter(s => s.user_id === fav.user_id);
          if (userSubs.length === 0) continue;

          const payload = JSON.stringify({
            title: "まもなく開催！",
            body: `お気に入りの「${tournament.title}」がまもなく開催されます。`,
            url: `/tournaments/${tournament.id}`,
          });

          let sentCount = 0;
          for (const sub of userSubs) {
            try {
              await webpush.sendNotification(
                {
                  endpoint: sub.endpoint,
                  keys: { p256dh: sub.p256dh, auth: sub.auth },
                },
                payload
              );
              sentCount++;
            } catch (e) {
              console.error("Push send error:", e);
            }
          }

          if (sentCount > 0) {
            results.tournament++;
            // 通知済みフラグを更新
            await supabaseAdmin
              .from("tournament_favorites")
              .update({ notified_at: new Date().toISOString() })
              .eq("id", fav.id);
          }
        }
      }
    }

    return NextResponse.json({ success: true, results });
  } catch (error: any) {
    console.error("Cron error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
