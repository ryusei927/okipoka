import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdminEmail } from "@/lib/admin";

// コードを4文字区切りで表示（カード印字用）
function formatCode(code: string): string {
  return code.match(/.{1,4}/g)?.join("-") ?? code;
}

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !isAdminEmail(user.email)) {
    return NextResponse.json({ error: "権限がありません" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const batchLabel = searchParams.get("batch");
  if (!batchLabel) {
    return NextResponse.json({ error: "batch is required" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: codes, error } = await admin
    .from("premium_codes")
    .select("code, duration_months, face_value_yen, expires_at, status")
    .eq("batch_label", batchLabel)
    .order("created_at", { ascending: true });

  if (error || !codes) {
    return NextResponse.json({ error: "取得に失敗しました" }, { status: 500 });
  }

  const header = "コード,期間(月),額面(円),登録期限,状態";
  const lines = codes.map((c) =>
    [
      formatCode(c.code),
      c.duration_months,
      c.face_value_yen ?? "",
      c.expires_at,
      c.status,
    ].join(",")
  );
  // ExcelでUTF-8として開けるようBOMを付ける
  const csv = "\uFEFF" + [header, ...lines].join("\r\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="premium-codes-${encodeURIComponent(
        batchLabel
      )}.csv"`,
    },
  });
}
