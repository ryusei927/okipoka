import { createClient } from "@/lib/supabase/server";
import TournamentForm from "../form";

export default async function Page() {
  const supabase = await createClient();
  
  // 店舗一覧を取得
  const { data: shops } = await supabase
    .from("shops")
    .select("id, name")
    .order("name");

  return <TournamentForm shops={shops || []} />;
}
