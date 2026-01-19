import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

const ADMIN_EMAIL = (process.env.OKIPOKA_ADMIN_EMAIL ?? "okipoka.jp@gmail.com").toLowerCase();

export async function POST(request: Request) {
  // 管理者認証チェック
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || user.email?.toLowerCase() !== ADMIN_EMAIL) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const { userId, months } = body as { userId?: string; months?: number };

  if (!userId || typeof userId !== "string") {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }

  if (!months || typeof months !== "number" || months < 1 || months > 12) {
    return NextResponse.json({ error: "months must be between 1 and 12" }, { status: 400 });
  }

  const admin = createAdminClient();

  // 有効期限を計算（今日から指定月数後）
  const expiresAt = new Date();
  expiresAt.setMonth(expiresAt.getMonth() + months);
  const expiresAtStr = expiresAt.toISOString().split("T")[0]; // YYYY-MM-DD

  const { error } = await admin
    .from("profiles")
    .update({
      subscription_status: "active",
      payment_method: "cash",
      subscription_expires_at: expiresAtStr,
    })
    .eq("id", userId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ 
    success: true, 
    expiresAt: expiresAtStr,
    message: `${months}ヶ月の現金サブスクを付与しました` 
  });
}

export async function DELETE(request: Request) {
  // 管理者認証チェック
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || user.email?.toLowerCase() !== ADMIN_EMAIL) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }

  const admin = createAdminClient();

  const { error } = await admin
    .from("profiles")
    .update({
      subscription_status: "canceled",
      payment_method: null,
      subscription_expires_at: null,
    })
    .eq("id", userId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ 
    success: true, 
    message: "現金サブスクを解除しました" 
  });
}
