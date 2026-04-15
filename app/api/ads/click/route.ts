import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const { adId } = JSON.parse(body);

    if (!adId || typeof adId !== "string") {
      return NextResponse.json({ error: "Invalid adId" }, { status: 400 });
    }

    const supabase = await createClient();
    await supabase.rpc("increment_ad_click", { ad_id: adId });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
