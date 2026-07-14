"use server";

import { randomBytes } from "crypto";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdminEmail } from "@/lib/admin";

// 紛らわしい文字（0/O/1/I/L）を除いたアルファベット
const CODE_ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
const CODE_LENGTH = 12;

async function assertAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !isAdminEmail(user.email)) {
    throw new Error("権限がありません");
  }
}

function generateCode(): string {
  const bytes = randomBytes(CODE_LENGTH);
  let code = "";
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += CODE_ALPHABET[bytes[i] % CODE_ALPHABET.length];
  }
  return code;
}

export async function generateCodes(formData: FormData) {
  await assertAdmin();

  const count = Number(formData.get("count"));
  const durationMonths = Number(formData.get("durationMonths"));
  const faceValueYen = Number(formData.get("faceValueYen")) || null;
  const batchLabel = String(formData.get("batchLabel") ?? "").trim();
  const expiresAt = String(formData.get("expiresAt") ?? "");

  if (!Number.isInteger(count) || count < 1 || count > 1000) {
    return { ok: false as const, error: "発行枚数は1〜1000で指定してください" };
  }
  if (!Number.isInteger(durationMonths) || durationMonths < 1 || durationMonths > 12) {
    return { ok: false as const, error: "期間は1〜12ヶ月で指定してください" };
  }
  if (!batchLabel) {
    return { ok: false as const, error: "ロット名を入力してください" };
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(expiresAt)) {
    return { ok: false as const, error: "登録期限を指定してください" };
  }

  // 資金決済法の適用除外を維持するため、登録期限は発行から6ヶ月以内に制限
  const maxExpiry = new Date();
  maxExpiry.setMonth(maxExpiry.getMonth() + 6);
  if (new Date(expiresAt) > maxExpiry) {
    return {
      ok: false as const,
      error: "登録期限は発行日から6ヶ月以内にしてください（資金決済法対応）",
    };
  }

  const codes = new Set<string>();
  while (codes.size < count) {
    codes.add(generateCode());
  }

  const rows = Array.from(codes).map((code) => ({
    code,
    duration_months: durationMonths,
    face_value_yen: faceValueYen,
    batch_label: batchLabel,
    expires_at: expiresAt,
  }));

  const admin = createAdminClient();
  const { error } = await admin.from("premium_codes").insert(rows);

  if (error) {
    console.error("generateCodes error:", error);
    return { ok: false as const, error: "コードの発行に失敗しました" };
  }

  revalidatePath("/dashboard/premium-codes");
  return { ok: true as const, count };
}

export async function voidBatch(formData: FormData) {
  await assertAdmin();

  const batchLabel = String(formData.get("batchLabel") ?? "");
  if (!batchLabel) return;

  const admin = createAdminClient();
  const { error } = await admin
    .from("premium_codes")
    .update({ status: "void" })
    .eq("batch_label", batchLabel)
    .eq("status", "unused");

  if (error) {
    console.error("voidBatch error:", error);
  }

  revalidatePath("/dashboard/premium-codes");
}
