"use client";

import { useState } from "react";
import { updateFeaturedItem, deleteFeaturedItem, toggleFeaturedItemStatus } from "./actions";
import { Trash2, ExternalLink, Eye, EyeOff, Edit2, X, Save } from "lucide-react";
import Image from "next/image";

type FeaturedItem = {
  id: string;
  image_url: string;
  link_url: string | null;
  alt_text: string | null;
  is_active: boolean;
  created_at: string;
};

export function FeaturedItemRow({ item }: { item: FeaturedItem }) {
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleUpdate = async (formData: FormData) => {
    setIsLoading(true);
    try {
      await updateFeaturedItem(item.id, formData);
      setIsEditing(false);
    } catch (error) {
      alert("更新に失敗しました");
    } finally {
      setIsLoading(false);
    }
  };

  if (isEditing) {
    return (
      <div className="bg-white p-4 rounded-xl shadow-sm border border-orange-200 ring-1 ring-orange-200">
        <form action={handleUpdate} className="space-y-4">
          <div className="flex gap-4">
            <div className="w-32 shrink-0 space-y-2">
              <div className="relative w-32 h-20 bg-gray-100 rounded-lg overflow-hidden">
                <Image src={item.image_url} alt={item.alt_text || "PR Image"} fill className="object-cover opacity-50" />
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xs font-bold text-gray-600 bg-white/80 px-2 py-1 rounded">変更なし</span>
                </div>
              </div>
              <input type="file" name="image" accept="image/*" className="block w-full text-xs text-gray-500 file:mr-2 file:py-1 file:px-2 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100" />
            </div>
            
            <div className="flex-1 space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">リンクURL</label>
                <input type="url" name="linkUrl" defaultValue={item.link_url || ""} placeholder="https://..." className="w-full p-2 text-sm border border-gray-300 rounded-lg" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">代替テキスト</label>
                <textarea 
                  name="altText" 
                  defaultValue={item.alt_text || ""} 
                  placeholder="イベント名など" 
                  rows={3}
                  className="w-full p-2 text-sm border border-gray-300 rounded-lg resize-y" 
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="flex items-center gap-1 px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              disabled={isLoading}
            >
              <X className="w-4 h-4" />
              キャンセル
            </button>
            <button
              type="submit"
              className="flex items-center gap-1 px-3 py-2 text-sm text-white bg-orange-500 hover:bg-orange-600 rounded-lg transition-colors font-bold"
              disabled={isLoading}
            >
              <Save className="w-4 h-4" />
              {isLoading ? "保存中..." : "保存"}
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className={`bg-white p-4 rounded-xl shadow-sm border ${item.is_active ? 'border-orange-500 ring-1 ring-orange-500' : 'border-gray-200'} flex items-center gap-4`}>
      <div className="w-32 h-20 relative bg-gray-100 rounded-lg overflow-hidden shrink-0">
        <Image src={item.image_url} alt={item.alt_text || "PR Image"} fill className="object-cover" />
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          {item.is_active ? (
            <span className="text-xs font-bold bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">表示中</span>
          ) : (
            <span className="text-xs font-bold bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">非表示</span>
          )}
          <span className="text-xs text-gray-400">{new Date(item.created_at).toLocaleDateString()}</span>
        </div>
        {item.link_url && (
          <a href={item.link_url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline flex items-center gap-1 truncate">
            <ExternalLink className="w-3 h-3" />
            {item.link_url}
          </a>
        )}
        {item.alt_text && <p className="text-sm text-gray-600 truncate">{item.alt_text}</p>}
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => setIsEditing(true)}
          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          title="編集"
        >
          <Edit2 className="w-5 h-5" />
        </button>

        <form action={toggleFeaturedItemStatus.bind(null, item.id, !item.is_active)}>
          <button className={`p-2 rounded-lg transition-colors ${item.is_active ? 'text-orange-600 hover:bg-orange-50' : 'text-gray-400 hover:bg-gray-100'}`} title={item.is_active ? "非表示にする" : "表示する"}>
            {item.is_active ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
          </button>
        </form>
        
        <form action={deleteFeaturedItem.bind(null, item.id)}>
          <button className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="削除">
            <Trash2 className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
}
