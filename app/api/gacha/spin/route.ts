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

  const email = (user.email ?? "").toLowerCase();
  const isAdmin = email === "okipoka.jp@gmail.com";

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

  return NextResponse.json({ success: true, item: data });
}
