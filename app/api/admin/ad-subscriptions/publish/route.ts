import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdminEmail } from "@/lib/admin";
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !isAdminEmail(user.email)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    adId?: unknown;
    isActive?: unknown;
  };
  const adId = typeof body.adId === "string" && body.adId.length > 0 ? body.adId : null;
  const isActive = typeof body.isActive === "boolean" ? body.isActive : null;

  if (!adId || isActive === null) {
    return NextResponse.json({ error: "adId and isActive are required" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("ads")
    .update({ is_active: isActive, updated_at: new Date().toISOString() })
    .eq("id", adId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // 公開ページの広告キャッシュを更新
  revalidatePath("/");

  return NextResponse.json({ success: true, isActive });
}
