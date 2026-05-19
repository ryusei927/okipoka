import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import GachaItemForm from "../form";

export default async function EditGachaItemPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: item, error: itemError } = await supabase
    .from("gacha_items")
    .select("*")
    .eq("id", id)
    .is("deleted_at", null)
    .single();

  if (itemError || !item) {
    notFound();
  }

  const { data: shops } = await supabase
    .from("shops")
    .select("id, name")
    .order("name");

  return <GachaItemForm item={item} shops={shops || []} />;
}
