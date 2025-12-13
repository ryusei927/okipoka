"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export type GachaItemState = {
  message?: string;
  error?: string;
};

export async function upsertGachaItem(
  prevState: GachaItemState,
  formData: FormData
): Promise<GachaItemState> {
  const supabase = await createClient();

  const id = (formData.get("id") as string) || "";
  const name = (formData.get("name") as string) || "";
  const description = (formData.get("description") as string) || "";
  const probabilityRaw = formData.get("probability") as string;
  const type = (formData.get("type") as string) || "";
  const valueRaw = formData.get("value") as string;
  const costYenRaw = formData.get("costYen") as string;
  const stockTotalRaw = formData.get("stockTotal") as string;
  const expiresDaysRaw = formData.get("expiresDays") as string;
  const isActive = formData.get("isActive") === "on";
  const imageFile = formData.get("image") as File;

  let imageUrl = (formData.get("currentImageUrl") as string) || "";

  if (!name.trim()) return { error: "名前は必須です" };
  if (!type.trim()) return { error: "種類は必須です" };

  const probability = Number(probabilityRaw);
  if (!Number.isFinite(probability) || probability <= 0) {
    return { error: "当選確率（重み）は1以上の数値で入力してください" };
  }

  const value = valueRaw === "" ? null : Number(valueRaw);
  if (valueRaw !== "" && (!Number.isFinite(value) || (value as number) < 0)) {
    return { error: "value は0以上の数値で入力してください" };
  }

  const cost_yen = costYenRaw === "" ? 0 : Number(costYenRaw);
  if (!Number.isFinite(cost_yen) || cost_yen < 0) {
    return { error: "原価（円）は0以上の数値で入力してください" };
  }

  const stock_total = stockTotalRaw === "" ? null : Number(stockTotalRaw);
  if (stockTotalRaw !== "" && (!Number.isFinite(stock_total) || (stock_total as number) < 0)) {
    return { error: "当選上限（個）は0以上の数値で入力してください（空欄で無制限）" };
  }

  // ハズレは付与がないので上限は無効化
  const normalized_stock_total = type === "none" ? null : stock_total;

  const expires_days = expiresDaysRaw === "" ? 30 : Number(expiresDaysRaw);
  if (!Number.isFinite(expires_days) || expires_days < 0) {
    return { error: "有効期限（日）は0以上の数値で入力してください" };
  }

  // 画像アップロード（任意）
  if (imageFile && imageFile.size > 0) {
    const fileExt = imageFile.name.split(".").pop();
    const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `gacha/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("ads")
      .upload(filePath, imageFile);

    if (uploadError) {
      console.error(uploadError);
      return { error: "画像のアップロードに失敗しました" };
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("ads").getPublicUrl(filePath);

    imageUrl = publicUrl;
  }

  const data = {
    name: name.trim(),
    description: description.trim() || null,
    probability,
    type,
    value,
    cost_yen,
    expires_days,
    stock_total: normalized_stock_total,
    is_active: isActive,
    image_url: imageUrl || null,
  };

  let savedId = id || "";

  if (id) {
    // 既に当選済みの数を下回る上限は設定できない
    if (normalized_stock_total !== null) {
      const { data: current, error: getError } = await supabase
        .from("gacha_items")
        .select("stock_used")
        .eq("id", id)
        .single();

      if (getError) {
        console.error(getError);
        return { error: "保存に失敗しました" };
      }

      const used = Number(current?.stock_used || 0);
      if (used > (normalized_stock_total as number)) {
        return { error: `既に${used}個当選済みのため、当選上限は${used}以上にしてください` };
      }
    }

    const result = await supabase.from("gacha_items").update(data).eq("id", id);
    if (result.error) {
      console.error(result.error);
      return { error: "保存に失敗しました" };
    }
  } else {
    const result = await supabase
      .from("gacha_items")
      .insert({ ...data, stock_used: 0 })
      .select("id")
      .single();
    if (result.error) {
      console.error(result.error);
      return { error: "保存に失敗しました" };
    }
    savedId = result.data.id;
  }

  // ハズレ(type=none)を有効で保存した場合、他のハズレを自動で無効化して一意に保つ
  if (type === "none" && isActive && savedId) {
    await supabase
      .from("gacha_items")
      .update({ is_active: false })
      .eq("type", "none")
      .neq("id", savedId)
      .is("deleted_at", null);
  }

  revalidatePath("/dashboard/gacha");
  revalidatePath("/member/gacha");
  redirect("/dashboard/gacha");
}

export async function deleteGachaItem(id: string) {
  const supabase = await createClient();

  // 配布済みの景品でも履歴保持のため物理削除はせず、ソフト削除にする
  const { error } = await supabase
    .from("gacha_items")
    .update({ is_active: false, deleted_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    console.error(error);
    throw new Error("削除に失敗しました");
  }

  revalidatePath("/dashboard/gacha");
  revalidatePath("/member/gacha");
}

export async function toggleGachaItemStatus(id: string, isActive: boolean) {
  const supabase = await createClient();

  // ハズレ(type=none)をONにする場合、他のハズレは自動でOFFにする
  if (isActive) {
    const { data: item, error: getError } = await supabase
      .from("gacha_items")
      .select("id,type")
      .eq("id", id)
      .is("deleted_at", null)
      .single();

    if (getError) {
      console.error(getError);
      throw new Error("更新に失敗しました");
    }

    if (item?.type === "none") {
      await supabase
        .from("gacha_items")
        .update({ is_active: false })
        .eq("type", "none")
        .neq("id", id)
        .is("deleted_at", null);
    }
  }

  const { error } = await supabase
    .from("gacha_items")
    .update({ is_active: isActive })
    .eq("id", id)
    .is("deleted_at", null);

  if (error) {
    console.error(error);
    throw new Error("更新に失敗しました");
  }

  revalidatePath("/dashboard/gacha");
  revalidatePath("/member/gacha");
}

export async function autoAdjustLoseWeight(targetWinRate: number) {
  const supabase = await createClient();

  const MAX_LOSE_WEIGHT = 1_000_000;

  const target = Number(targetWinRate);
  if (!Number.isFinite(target) || target <= 0 || target >= 100) {
    throw new Error("当たり率は1〜99の範囲で指定してください");
  }

  const { data: items, error } = await supabase
    .from("gacha_items")
    .select("id,type,probability,is_active,deleted_at,created_at,stock_total,stock_used")
    .is("deleted_at", null)
    .eq("is_active", true);

  if (error) {
    console.error(error);
    throw new Error("景品の取得に失敗しました");
  }

  const activeItems = items || [];
  const eligibleItems = activeItems.filter((it: any) => {
    if (!it.is_active) return false;
    if (typeof it.stock_total === "number") {
      return (it.stock_used || 0) < it.stock_total;
    }
    return true;
  });

  if (eligibleItems.length === 0) {
    throw new Error("有効な景品がありません");
  }

  const loseItems = eligibleItems
    .filter((it: any) => it.type === "none")
    .sort((a: any, b: any) => {
      const at = a.created_at ? new Date(a.created_at).getTime() : 0;
      const bt = b.created_at ? new Date(b.created_at).getTime() : 0;
      return bt - at;
    });
  if (loseItems.length === 0) {
    throw new Error("ハズレ（type=none）を1つ作成して有効にしてください");
  }
  if (loseItems.length > 1) {
    // 最新の1つだけ残し、他は自動で無効化
    const keepId = loseItems[0].id;
    await supabase
      .from("gacha_items")
      .update({ is_active: false })
      .eq("type", "none")
      .neq("id", keepId)
      .is("deleted_at", null);
    loseItems.splice(1);
  }

  const winWeight = eligibleItems
    .filter((it: any) => it.type !== "none")
    .reduce((sum: number, it: any) => sum + (it.probability || 0), 0);

  if (winWeight <= 0) {
    throw new Error("当たり景品の重みが0です");
  }

  // winWeight / (winWeight + loseWeight) = target/100
  const rawLose = (winWeight * (100 - target)) / target;
  if (!Number.isFinite(rawLose) || rawLose > MAX_LOSE_WEIGHT) {
    throw new Error(
      `調整結果のハズレ重みが大きすぎます（${Math.round(rawLose)}）。目標当たり率を上げるか、当たり景品の重み/原価を見直してください。`
    );
  }
  const nextLose = Math.max(1, Math.round(rawLose));

  const { error: updateError } = await supabase
    .from("gacha_items")
    .update({ probability: nextLose })
    .eq("id", loseItems[0].id)
    .is("deleted_at", null);

  if (updateError) {
    console.error(updateError);
    throw new Error("更新に失敗しました");
  }

  revalidatePath("/dashboard/gacha");
  revalidatePath("/member/gacha");
}

export async function autoAdjustLoseWeightByExpectedValue(targetExpectedYen: number) {
  const supabase = await createClient();

  const MAX_LOSE_WEIGHT = 1_000_000;

  const target = Number(targetExpectedYen);
  if (!Number.isFinite(target) || target <= 0) {
    throw new Error("期待値（円）は1以上の数値で指定してください");
  }

  const { data: items, error } = await supabase
    .from("gacha_items")
    .select("id,type,probability,is_active,deleted_at,created_at,cost_yen,stock_total,stock_used")
    .is("deleted_at", null)
    .eq("is_active", true);

  if (error) {
    console.error(error);
    throw new Error("景品の取得に失敗しました");
  }

  const activeItems = items || [];
  const eligibleItems = activeItems.filter((it: any) => {
    if (!it.is_active) return false;
    if (typeof it.stock_total === "number") {
      return (it.stock_used || 0) < it.stock_total;
    }
    return true;
  });

  if (eligibleItems.length === 0) {
    throw new Error("有効な景品がありません");
  }

  const loseItems = eligibleItems
    .filter((it: any) => it.type === "none")
    .sort((a: any, b: any) => {
      const at = a.created_at ? new Date(a.created_at).getTime() : 0;
      const bt = b.created_at ? new Date(b.created_at).getTime() : 0;
      return bt - at;
    });

  if (loseItems.length === 0) {
    throw new Error("ハズレ（type=none）を1つ作成して有効にしてください");
  }
  if (loseItems.length > 1) {
    const keepId = loseItems[0].id;
    await supabase
      .from("gacha_items")
      .update({ is_active: false })
      .eq("type", "none")
      .neq("id", keepId)
      .is("deleted_at", null);
    loseItems.splice(1);
  }

  const winItems = eligibleItems.filter((it: any) => it.type !== "none");
  const winWeight = winItems.reduce((sum: number, it: any) => sum + (it.probability || 0), 0);
  if (winWeight <= 0) {
    throw new Error("当たり景品の重みが0です");
  }

  const winCostSum = winItems.reduce(
    (sum: number, it: any) => sum + (it.probability || 0) * (it.cost_yen || 0),
    0
  );
  if (winCostSum <= 0) {
    throw new Error("当たり景品の原価（cost_yen）がすべて0です");
  }

  const maxEV = winCostSum / winWeight;
  if (target > maxEV) {
    throw new Error(
      `指定した期待値が上限を超えています（上限: ${maxEV.toFixed(1)}円）。当たり景品の原価/重みを見直してください。`
    );
  }

  // EV = winCostSum / (winWeight + loseWeight)
  // => loseWeight = winCostSum/EV - winWeight
  const rawLose = winCostSum / target - winWeight;
  if (!Number.isFinite(rawLose) || rawLose > MAX_LOSE_WEIGHT) {
    throw new Error(
      `調整結果のハズレ重みが大きすぎます（${Math.round(rawLose)}）。目標期待値を上げるか、当たり景品の重み/原価を見直してください。`
    );
  }
  const nextLose = Math.max(1, Math.round(rawLose));

  const { error: updateError } = await supabase
    .from("gacha_items")
    .update({ probability: nextLose })
    .eq("id", loseItems[0].id)
    .is("deleted_at", null);

  if (updateError) {
    console.error(updateError);
    throw new Error("更新に失敗しました");
  }

  revalidatePath("/dashboard/gacha");
  revalidatePath("/member/gacha");
}
