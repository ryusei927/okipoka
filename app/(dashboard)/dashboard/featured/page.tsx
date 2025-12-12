import { createClient } from "@/lib/supabase/server";
import { createFeaturedItem } from "./actions";
import { FeaturedItemRow } from "./FeaturedItemRow";

export default async function FeaturedPage() {
  const supabase = await createClient();
  
  const { data: items } = await supabase
    .from("featured_items")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-gray-900">ピックアップPR管理</h1>

      {/* 新規登録フォーム */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h2 className="font-bold text-lg mb-4">新規PR登録</h2>
        <form action={createFeaturedItem} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">画像 (必須)</label>
            <input type="file" name="image" accept="image/*" required className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100" />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">リンクURL (任意)</label>
            <input type="url" name="linkUrl" placeholder="https://..." className="w-full p-2 border border-gray-300 rounded-lg" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">代替テキスト (任意)</label>
            <textarea 
              name="altText" 
              placeholder="イベント名など" 
              rows={3}
              className="w-full p-2 border border-gray-300 rounded-lg resize-y" 
            />
          </div>

          <button type="submit" className="bg-orange-500 text-white px-4 py-2 rounded-lg font-bold hover:bg-orange-600 transition-colors">
            登録して表示
          </button>
        </form>
      </div>

      {/* 一覧 */}
      <div className="space-y-4">
        <h2 className="font-bold text-lg">登録済みPR一覧</h2>
        {items?.map((item) => (
          <FeaturedItemRow key={item.id} item={item} />
        ))}
        {items?.length === 0 && (
          <p className="text-gray-500 text-center py-8">登録されたPRはありません</p>
        )}
      </div>
    </div>
  );
}
