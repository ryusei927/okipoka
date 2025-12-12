import { createClient } from "@/lib/supabase/server";
import { Store, MapPin } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default async function ShopsPage() {
  const supabase = await createClient();
  const { data: shops } = await supabase.from("shops").select("*").order("name");

  // エリアごとにグループ化
  const groupedShops = (shops || []).reduce((acc, shop) => {
    const area = shop.area || "その他";
    if (!acc[area]) {
      acc[area] = [];
    }
    acc[area].push(shop);
    return acc;
  }, {} as Record<string, typeof shops>);

  // 表示順序の定義
  const areaOrder = ["那覇", "中部", "南部", "北部", "宮古島", "その他"];

  return (
    <div className="pb-20 pt-6 px-4">
      <h1 className="text-2xl font-bold text-center mb-8 text-gray-900">店舗一覧</h1>

      <div className="space-y-8">
        {areaOrder.map((area) => {
          const areaShops = groupedShops[area];
          if (!areaShops || areaShops.length === 0) return null;

          return (
            <div key={area}>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-1 h-6 bg-orange-500 rounded-full"></div>
                <h2 className="text-lg font-bold text-gray-700">{area}</h2>
              </div>

              <div className="space-y-4">
                {areaShops.map((shop: any) => (
                  <Link
                    key={shop.id}
                    href={`/shops/${shop.id}`}
                    className="flex items-center gap-4 p-4 bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all"
                  >
                    <div className="w-12 h-12 bg-gray-100 rounded-full shrink-0 overflow-hidden relative flex items-center justify-center border border-gray-100">
                      {shop.image_url ? (
                        <Image
                          src={shop.image_url}
                          alt={shop.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <Store className="w-6 h-6 text-gray-300" />
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-900 truncate">{shop.name}</h3>
                      {shop.address && (
                        <div className="flex items-center gap-1 text-xs text-gray-500 mt-1 truncate">
                          <MapPin className="w-3 h-3" />
                          <span>{shop.address}</span>
                        </div>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
