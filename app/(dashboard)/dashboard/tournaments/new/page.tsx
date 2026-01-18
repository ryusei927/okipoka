import { createClient } from "@/lib/supabase/server";
import TournamentForm from "../form";

export default async function Page() {
  const supabase = await createClient();
  
  // 店舗一覧を取得
  const { data: shops } = await supabase
    .from("shops")
    .select("id, name")
    .order("name");

  // 過去のトーナメント履歴を取得（入力補助用）
  // テンプレートとして登録されているもののみ取得
  const { data: recentTournaments } = await supabase
    .from("tournaments")
    .select("*")
    .eq("is_template", true)
    .order("created_at", { ascending: false })
    .limit(100);

  return <TournamentForm shops={shops || []} recentTournaments={recentTournaments || []} />;
}
