"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

// 作成・更新共通の型定義
export type TournamentState = {
  message?: string;
  error?: string;
};

export async function upsertTournament(prevState: TournamentState, formData: FormData): Promise<TournamentState> {
  const supabase = await createClient();

  const id = formData.get("id") as string;
  const title = formData.get("title") as string;
  const shopId = formData.get("shopId") as string;
  const date = formData.get("date") as string;
  const time = formData.get("time") as string;
  const buyIn = formData.get("buyIn") as string;
  
  // 新規追加フィールド
  const lateRegTime = formData.get("lateRegTime") as string;
  const reentryFee = formData.get("reentryFee") as string;
  const addonFee = formData.get("addonFee") as string;
  const addonStatus = formData.get("addonStatus") as string;
  const addonStack = formData.get("addonStack") as string;
  const stack = formData.get("stack") as string;
  const prizes = formData.get("prizes") as string;
  const notes = formData.get("notes") as string;
  const type = formData.get("type") as string || "トーナメント";
  const isTemplate = formData.get("isTemplate") === "on";

  // 日時を結合してISO文字列に変換 (JSTとして扱う)
  const startAt = new Date(`${date}T${time}:00+09:00`).toISOString();

  // レイトレジストレーション日時の計算
  let lateRegAt = null;
  if (lateRegTime) {
    // 基本は開始日と同じ日付
    let lateRegDateStr = date;
    
    // 開始時間と締切時間を比較して、締切の方が早い時間なら翌日とみなす簡易ロジック
    // (例: 開始 21:00, 締切 03:00 -> 翌日03:00)
    if (time > lateRegTime) {
      const d = new Date(date);
      d.setDate(d.getDate() + 1);
      lateRegDateStr = d.toISOString().split('T')[0];
    }
    
    lateRegAt = new Date(`${lateRegDateStr}T${lateRegTime}:00+09:00`).toISOString();
  }

  const data = {
    title,
    shop_id: shopId,
    start_at: startAt,
    buy_in: buyIn,
    tags: [type], // typeをタグとして使用
    late_reg_at: lateRegAt,
    reentry_fee: reentryFee,
    addon_fee: addonFee,
    addon_status: addonStatus,
    addon_stack: addonStack,
    stack: stack,
    prizes: prizes,
    notes: notes,
    type: type,
    is_template: isTemplate,
  };

  let error;
  if (id) {
    // 更新
    const result = await supabase.from("tournaments").update(data).eq("id", id);
    error = result.error;
  } else {
    // 新規作成
    const result = await supabase.from("tournaments").insert(data);
    error = result.error;
  }

  if (error) {
    console.error(error);
    return { error: "保存に失敗しました" };
  }

  revalidatePath("/dashboard/tournaments");
  revalidatePath("/");
  redirect("/dashboard/tournaments");
}

export async function deleteTournament(id: string) {
  const supabase = await createClient();
  
  const { error } = await supabase.from("tournaments").delete().eq("id", id);

  if (error) {
    console.error(error);
    throw new Error("削除に失敗しました");
  }

  revalidatePath("/dashboard/tournaments");
  revalidatePath("/");
}

export async function removeTemplate(id: string) {
  const supabase = await createClient();
  
  const { error } = await supabase
    .from("tournaments")
    .update({ is_template: false })
    .eq("id", id);

  if (error) {
    console.error(error);
    throw new Error("テンプレートの解除に失敗しました");
  }

  revalidatePath("/dashboard/tournaments/new");
}
