import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import AdForm from "../form";

export default async function EditAdPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  
  const { data: ad } = await supabase
    .from("ads")
    .select("*")
    .eq("id", id)
    .single();

  if (!ad) {
    notFound();
  }

  return <AdForm ad={ad} />;
}
