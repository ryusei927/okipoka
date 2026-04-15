import { createClient } from "@/lib/supabase/server";
import { Plus, Store } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default async function ShopsPage() {
  const supabase = await createClient();
  const { data: shops } = await supabase.from("shops").select("*").order("name");

  return (
    <div className="pb-20">
      <header className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900">店舗管理</h1>
        <Link
          href="/dashboard/shops/new"
          className="flex items-center gap-2 bg-orange-500 text-white px-4 py-2 font-bold text-sm hover:bg-orange-600 transition-colors"
        >
          <Plus className="w-4 h-4" />
          新規登録
        </Link>
      </header>

      <div className="grid gap-4">
        {shops?.map((shop) => (
          <Link
            key={shop.id}
            href={`/dashboard/shops/${shop.id}`}
            className="bg-white p-4 border border-gray-200 flex items-center gap-4 hover:border-orange-500/30 transition-colors"
          >
            <div className="w-16 h-16 bg-gray-50 flex-shrink-0 overflow-hidden relative flex items-center justify-center">
              {shop.image_url ? (
                <Image
                  src={shop.image_url}
                  alt={shop.name}
                  fill
                  className="object-cover"
                />
              ) : (
                <Store className="w-8 h-8 text-gray-500" />
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-gray-900 truncate">{shop.name}</h3>
              <p className="text-xs text-gray-500 mt-1 truncate">ID: {shop.slug}</p>
            </div>
          </Link>
        ))}

        {shops?.length === 0 && (
          <div className="text-center py-10 text-gray-500">
            店舗がまだ登録されていません
          </div>
        )}
      </div>
    </div>
  );
}
