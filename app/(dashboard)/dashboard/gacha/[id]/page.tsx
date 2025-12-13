import { createClient } from "@/lib/supabase/server";
import GachaItemForm from "../form";

export default async function EditGachaItemPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: item } = await supabase
    .from("gacha_items")
    .select("*")
    .eq("id", id)
    .single();

  return <GachaItemForm item={item} />;
}
