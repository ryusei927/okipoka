import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// プレミアム会員を手動で付与/解除するAPI
export async function POST(request: Request) {
  const supabase = await createClient();
  
  // 管理者チェック
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  const adminEmail = (process.env.OKIPOKA_ADMIN_EMAIL ?? "okipoka.jp@gmail.com").toLowerCase();
  if ((user.email ?? "").toLowerCase() !== adminEmail) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { userId, action, expiresAt } = body as { 
    userId: string; 
    action: "grant" | "revoke";
    expiresAt?: string; // 有効期限（任意）YYYY-MM-DD形式
  };

  if (!userId || !action) {
    return NextResponse.json({ error: "userId and action are required" }, { status: 400 });
  }

  try {
    if (action === "grant") {
      // プレミアム付与（現金払い）
      // subscription_statusを "active" に設定
      // payment_method を "cash" に設定して区別
      const updateData: Record<string, unknown> = {
        subscription_status: "active",
        payment_method: "cash", // 現金払いのマーカー
      };

      // 有効期限が指定されている場合は設定
      if (expiresAt) {
        updateData.subscription_expires_at = expiresAt;
      }

      const { error } = await supabase
        .from("profiles")
        .update(updateData)
        .eq("id", userId);

      if (error) throw error;

      return NextResponse.json({ 
        success: true, 
        message: "プレミアム会員を付与しました",
        status: "active"
      });

    } else if (action === "revoke") {
      // プレミアム解除
      const { error } = await supabase
        .from("profiles")
        .update({
          subscription_status: "canceled",
          subscription_id: null,
          payment_method: null,
          subscription_expires_at: null,
        })
        .eq("id", userId);

      if (error) throw error;

      return NextResponse.json({ 
        success: true, 
        message: "プレミアム会員を解除しました",
        status: "canceled"
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });

  } catch (error: unknown) {
    console.error("Premium grant/revoke error:", error);
    const message = error instanceof Error ? error.message : "Operation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
