import { redirect } from "next/navigation";

export default async function ShopDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/shops#shop-${id}`);
}
