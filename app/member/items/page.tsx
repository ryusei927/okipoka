"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Ticket, Gift } from "lucide-react";

type UserItem = {
  id: string;
  is_used: boolean;
  used_at: string | null;
  expires_at: string | null;
  created_at: string;
  gacha_items: {
    name: string;
    description: string;
    type: string;
    value: number;
  };
};

export default function ItemsPage() {
  const [items, setItems] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("user_items")
      .select(`
        *,
        gacha_items (
          name,
          description,
          type,
          value
        )
      `)
      .eq("user_id", user.id)
      .eq("is_used", false)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching items:", error);
    } else {
      setItems(data as any);
    }
    setLoading(false);
  };

  const useItem = async (itemId: string) => {
    if (!confirm("このチケットを使用済みにしますか？\n（店舗スタッフに提示してから押してください）")) {
      return;
    }

    const { error } = await supabase
      .from("user_items")
      .update({ 
        is_used: true,
        used_at: new Date().toISOString()
      })
      .eq("id", itemId);

    if (error) {
      alert("エラーが発生しました");
    } else {
      fetchItems();
    }
  };

  if (loading) {
    return <div className="p-8 text-center">読み込み中...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">獲得アイテム一覧</h1>

      {items.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Gift className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-500">まだアイテムを持っていません。</p>
          <p className="text-sm text-gray-400 mt-2">ガチャを回してアイテムをゲットしよう！</p>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <div 
              key={item.id} 
              className={`bg-white border rounded-lg p-4 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 ${item.is_used ? 'opacity-50 bg-gray-50' : ''}`}
            >
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-full ${item.gacha_items.type === 'drink_ticket' ? 'bg-blue-100 text-blue-600' : 'bg-orange-100 text-orange-600'}`}>
                  <Ticket className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">{item.gacha_items.name}</h3>
                  <p className="text-sm text-gray-600">{item.gacha_items.description}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    獲得日: {new Date(item.created_at).toLocaleDateString()}
                    {item.expires_at && ` / 有効期限: ${new Date(item.expires_at).toLocaleDateString()}`}
                  </p>
                </div>
              </div>

              <div>
                {item.is_used ? (
                  <span className="px-4 py-2 bg-gray-200 text-gray-500 rounded-full text-sm font-medium">
                    使用済み
                  </span>
                ) : (
                  <button
                    onClick={() => useItem(item.id)}
                    className="px-6 py-2 bg-orange-500 text-white rounded-full text-sm font-bold hover:bg-orange-600 transition-colors shadow-md"
                  >
                    使用する
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
