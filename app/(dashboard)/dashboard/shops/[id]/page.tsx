import { createClient } from "@/lib/supabase/server";
import ShopForm from "../form";

export default async function EditShopPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  
  const { data: shop } = await supabase
    .from("shops")
    .select("*")
    .eq("id", id)
    .single();

  if (!shop) {
    return <div>店舗が見つかりません</div>;
  }

  return <ShopForm shop={shop} />;
}
