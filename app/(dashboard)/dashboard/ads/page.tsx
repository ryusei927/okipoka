import { createClient } from "@/lib/supabase/server";
import { PlusCircle, ArrowLeft, ExternalLink } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { DeleteAdButton } from "./DeleteAdButton";

export default async function AdsPage() {
  const supabase = await createClient();
  const { data: ads } = await supabase
    .from("ads")
    .select("*")
    .order("priority", { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <ArrowLeft className="w-6 h-6 text-gray-500" />
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">広告管理</h1>
        </div>
        <Link
          href="/dashboard/ads/new"
          className="flex items-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-lg font-bold hover:bg-orange-600 transition-colors"
        >
          <PlusCircle className="w-5 h-5" />
          新規作成
        </Link>
      </div>

      <div className="grid gap-4">
        {ads?.map((ad) => (
          <div
            key={ad.id}
            className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex items-center gap-4"
          >
            <div className="w-24 h-16 relative bg-gray-100 rounded-lg overflow-hidden shrink-0">
              <Image
                src={ad.image_url}
                alt={ad.title}
                fill
                className="object-cover"
              />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                  ad.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
                }`}>
                  {ad.is_active ? "公開中" : "非公開"}
                </span>
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold">
                  {ad.type === 'banner' ? 'バナー' : 'スクエア'}
                </span>
              </div>
              <h3 className="font-bold text-gray-900 truncate">{ad.title}</h3>
              {ad.link_url && (
                <a 
                  href={ad.link_url} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-xs text-gray-500 flex items-center gap-1 hover:text-orange-500 min-w-0"
                >
                  <ExternalLink className="w-3 h-3 shrink-0" />
                  <span className="truncate flex-1">{ad.link_url}</span>
                </a>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Link
                href={`/dashboard/ads/${ad.id}`}
                className="px-3 py-1.5 text-sm font-bold text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                編集
              </Link>
              <DeleteAdButton id={ad.id} />
            </div>
          </div>
        ))}

        {(!ads || ads.length === 0) && (
          <div className="text-center py-10 text-gray-500">
            広告が登録されていません
          </div>
        )}
      </div>
    </div>
  );
}
