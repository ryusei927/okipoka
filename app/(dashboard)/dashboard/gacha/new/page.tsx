import { createClient } from "@/lib/supabase/server";
import GachaItemForm from "../form";

export default async function NewGachaItemPage() {
  const supabase = await createClient();
  const { data: shops } = await supabase
    .from("shops")
    .select("id, name")
    .order("name");

  return <GachaItemForm shops={shops || []} />;
}
