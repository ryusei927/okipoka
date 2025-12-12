import { createClient } from "@/lib/supabase/server";
import TournamentForm from "../form";

export default async function EditTournamentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  
  // 店舗一覧
  const { data: shops } = await supabase
    .from("shops")
    .select("id, name")
    .order("name");

  // 大会情報
  const { data: tournament } = await supabase
    .from("tournaments")
    .select("*")
    .eq("id", id)
    .single();

  if (!tournament) {
    return <div>大会が見つかりません</div>;
  }

  return <TournamentForm shops={shops || []} tournament={tournament} />;
}
