import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 1. サブスク会員かどうかチェック
  const { data: profile } = await supabase
    .from("profiles")
    .select("subscription_status, last_gacha_at")
    .eq("id", user.id)
    .single();

  if (profile?.subscription_status !== 'active') {
    return NextResponse.json({ error: "Subscription required" }, { status: 403 });
  }

  // 2. 1日1回制限チェック
  const now = new Date();
  if (profile.last_gacha_at) {
    const lastGacha = new Date(profile.last_gacha_at);
    // 日本時間で日付が変わっているかチェック（簡易的に日付文字列比較）
    // サーバーがUTCの場合、+9時間して日付を取得
    const jstNow = new Date(now.getTime() + 9 * 60 * 60 * 1000);
    const jstLast = new Date(lastGacha.getTime() + 9 * 60 * 60 * 1000);
    
    if (
      jstNow.getUTCFullYear() === jstLast.getUTCFullYear() &&
      jstNow.getUTCMonth() === jstLast.getUTCMonth() &&
      jstNow.getUTCDate() === jstLast.getUTCDate()
    ) {
      return NextResponse.json({ error: "Already played today" }, { status: 400 });
    }
  }

  // 3. ガチャロジック
  const { data: items } = await supabase
    .from("gacha_items")
    .select("*")
    .eq("is_active", true);

  if (!items || items.length === 0) {
    return NextResponse.json({ error: "No items available" }, { status: 500 });
  }

  // 確率計算
  const totalWeight = items.reduce((sum, item) => sum + item.probability, 0);
  let random = Math.random() * totalWeight;
  let selectedItem = items[items.length - 1];

  for (const item of items) {
    if (random < item.probability) {
      selectedItem = item;
      break;
    }
    random -= item.probability;
  }

  // 4. 結果保存
  // トランザクション的に行いたいが、Supabase Clientでは難しいので順次実行
  
  // ログ保存
  await supabase.from("gacha_logs").insert({
    user_id: user.id,
    item_id: selectedItem.id,
  });

  // アイテム付与（ハズレ以外）
  if (selectedItem.type !== 'none') {
    await supabase.from("user_items").insert({
      user_id: user.id,
      item_id: selectedItem.id,
      // 有効期限を30日後に設定する例
      expires_at: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    });
  }

  // 最終実行日時更新
  await supabase
    .from("profiles")
    .update({ last_gacha_at: now.toISOString() })
    .eq("id", user.id);

  return NextResponse.json({ 
    success: true, 
    item: selectedItem 
  });
}
