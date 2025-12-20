"use client";

import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { Ticket, Gift, History, Store, X, CheckCircle2, AlertCircle } from "lucide-react";
import Link from "next/link";

type UserItem = {
  id: string;
  is_used: boolean;
  used_at: string | null;
  expires_at: string | null;
  created_at: string;
  gacha_items: {
    name: string;
    description: string;
    image_url: string | null;
    type: string;
    value: number;
    shops?: {
      id: string;
      name: string;
      slug: string;
      image_url: string | null;
    } | null;
  };
};

export default function ItemsPage() {
  const [items, setItems] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'unused' | 'used'>('unused');
  const [selectedShopId, setSelectedShopId] = useState<string | null>(null);
  
  // モーダル用state
  const [viewingItem, setViewingItem] = useState<UserItem | null>(null); // 詳細表示用
  const [confirmingItem, setConfirmingItem] = useState<UserItem | null>(null); // 使用確認用
  const [isPressing, setIsPressing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  
  const supabase = createClient();

  useEffect(() => {
    fetchItems();
    setSelectedShopId(null); // タブ切り替え時にフィルターをリセット
  }, [activeTab]);

  // 店舗リストの抽出（重複排除）
  const uniqueShops = Array.from(new Map(
    items
      .filter(item => item.gacha_items.shops)
      .map(item => [item.gacha_items.shops!.id, item.gacha_items.shops!])
  ).values());

  // フィルタリングされたアイテム
  const filteredItems = selectedShopId
    ? items.filter(item => item.gacha_items.shops?.id === selectedShopId)
    : items;

  // 長押し判定ロジック
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPressing && !isComplete) {
      interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            handleComplete();
            return 100;
          }
          return prev + 4; // 25ms * 25 = 625msくらいで完了（少し早めに）
        });
      }, 20);
    } else if (!isComplete) {
      setProgress(0);
    }
    return () => clearInterval(interval);
  }, [isPressing, isComplete]);

  const handleComplete = async () => {
    setIsComplete(true);
    setIsPressing(false);
    if (confirmingItem) {
      await executeUseItem(confirmingItem.id);
      // 少し待ってから閉じる
      setTimeout(() => {
        setConfirmingItem(null);
        setIsComplete(false);
        setProgress(0);
      }, 1500);
    }
  };

  const fetchItems = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("user_items")
      .select(`
        *,
        gacha_items (
          name,
          description,
          image_url,
          type,
          value,
          shops (
            id,
            name,
            slug,
            image_url
          )
        )
      `)
      .eq("user_id", user.id)
      .eq("is_used", activeTab === 'used')
      .order(activeTab === 'used' ? "used_at" : "created_at", { ascending: false });

    if (error) {
      console.error("Error fetching items:", error);
    } else {
      setItems(data as any);
    }
    setLoading(false);
  };

  const openConfirmModal = (item: UserItem) => {
    setViewingItem(null); // 詳細モーダルが開いていたら閉じる
    setConfirmingItem(item);
    setProgress(0);
    setIsComplete(false);
    setIsPressing(false);
  };

  const closeConfirmModal = () => {
    if (isComplete) return; // 完了後は閉じさせない（自動で閉じるのを待つ）
    setConfirmingItem(null);
    setProgress(0);
    setIsPressing(false);
  };

  const executeUseItem = async (itemId: string) => {
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

  return (
    <div className="max-w-2xl mx-auto p-6 pb-24">
      <h1 className="text-2xl font-bold mb-6">獲得アイテム一覧</h1>

      <div className="flex p-1 bg-gray-100 rounded-xl mb-6">
        <button
          onClick={() => setActiveTab('unused')}
          className={`flex-1 py-2 px-4 rounded-lg text-sm font-bold transition-all ${
            activeTab === 'unused' 
              ? 'bg-white text-slate-800 shadow-sm' 
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          未使用
        </button>
        <button
          onClick={() => setActiveTab('used')}
          className={`flex-1 py-2 px-4 rounded-lg text-sm font-bold transition-all ${
            activeTab === 'used' 
              ? 'bg-white text-slate-800 shadow-sm' 
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          使用済み履歴
        </button>
      </div>

      {/* 店舗フィルター */}
      {uniqueShops.length > 0 && (
        <div className="mb-6 overflow-x-auto pb-2 -mx-6 px-6 scrollbar-hide touch-pan-x">
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedShopId(null)}
              className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-colors border ${
                selectedShopId === null
                  ? 'bg-slate-800 text-white border-slate-800'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              すべて
            </button>
            {uniqueShops.map((shop) => (
              <button
                key={shop.id}
                onClick={() => setSelectedShopId(shop.id)}
                className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-colors border flex items-center gap-2 ${
                  selectedShopId === shop.id
                    ? 'bg-slate-800 text-white border-slate-800'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {shop.image_url && (
                  <img src={shop.image_url} alt="" className="w-4 h-4 rounded-full object-cover" />
                )}
                {shop.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {loading ? (
        <div className="p-8 text-center">読み込み中...</div>
      ) : filteredItems.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          {activeTab === 'unused' ? (
            <>
              <Gift className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">
                {selectedShopId ? "この店舗のアイテムはありません。" : "まだアイテムを持っていません。"}
              </p>
              {!selectedShopId && (
                <p className="text-sm text-gray-400 mt-2">ガチャを回してアイテムをゲットしよう！</p>
              )}
            </>
          ) : (
            <>
              <History className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">
                {selectedShopId ? "この店舗の使用済みアイテムはありません。" : "使用済みのアイテムはありません。"}
              </p>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredItems.map((item) => (
            <div 
              key={item.id} 
              className={`bg-white border rounded-lg p-4 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 ${item.is_used ? 'opacity-75 bg-gray-50' : ''}`}
            >
              <div className="flex items-start gap-4 flex-1">
                <div 
                  className={`rounded-full shrink-0 overflow-hidden flex items-center justify-center w-12 h-12 ${
                    (item.gacha_items.image_url || item.gacha_items.shops?.image_url) 
                      ? 'p-0' 
                      : 'p-3'
                  } ${item.gacha_items.type === 'drink_ticket' ? 'bg-blue-100 text-blue-600' : 'bg-orange-100 text-orange-600'}`}
                  onClick={() => setViewingItem(item)}
                >
                  {(item.gacha_items.image_url || item.gacha_items.shops?.image_url) ? (
                    <img 
                      src={item.gacha_items.image_url || item.gacha_items.shops?.image_url || ""} 
                      alt="" 
                      className="w-full h-full object-cover" 
                    />
                  ) : (
                    <Ticket className="w-6 h-6" />
                  )}
                </div>
                <div className="flex-1 min-w-0" onClick={() => setViewingItem(item)}>
                  <h3 className="font-bold text-lg truncate">{item.gacha_items.name}</h3>
                  {item.gacha_items.shops && (
                    <div className="flex items-center gap-1 text-xs font-bold text-orange-600 mb-1">
                      <Store className="w-3 h-3" />
                      {item.gacha_items.shops.name}
                    </div>
                  )}
                  <p className="text-sm text-gray-600 line-clamp-2">{item.gacha_items.description}</p>
                  {item.expires_at && !item.is_used && (
                    <p className="text-xs text-red-500 mt-1">
                      有効期限: {new Date(item.expires_at).toLocaleDateString()}
                    </p>
                  )}
                  {item.used_at && (
                    <p className="text-xs text-gray-500 mt-1">
                      使用日: {new Date(item.used_at).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto mt-4 sm:mt-0">
                <button
                  onClick={() => setViewingItem(item)}
                  className="px-4 py-2 bg-white border border-gray-300 text-gray-700 font-bold rounded-lg hover:bg-gray-50 transition-colors text-sm whitespace-nowrap"
                >
                  詳細
                </button>
                {!item.is_used && (
                  <button
                    onClick={() => openConfirmModal(item)}
                    className="px-6 py-2 bg-slate-900 text-white font-bold rounded-lg hover:bg-slate-800 transition-colors text-sm whitespace-nowrap"
                  >
                    使用する
                  </button>
                )}
                {item.is_used && (
                  <div className="px-4 py-2 bg-gray-200 text-gray-500 font-bold rounded-lg text-sm whitespace-nowrap text-center">
                    使用済み
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 詳細表示モーダル */}
      {viewingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 relative flex flex-col max-h-[90vh]">
            <button 
              onClick={() => setViewingItem(null)}
              className="absolute top-4 right-4 p-2 bg-black/10 hover:bg-black/20 rounded-full transition-colors z-10 backdrop-blur-md"
            >
              <X className="w-5 h-5 text-white drop-shadow-md" />
            </button>

            {/* ヘッダー画像エリア */}
            <div className="w-full h-48 bg-slate-100 relative shrink-0">
              {(viewingItem.gacha_items.image_url || viewingItem.gacha_items.shops?.image_url) ? (
                <img 
                  src={viewingItem.gacha_items.image_url || viewingItem.gacha_items.shops?.image_url || ""} 
                  alt={viewingItem.gacha_items.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-300">
                  <Gift className="w-16 h-16" />
                </div>
              )}
              <div className="absolute inset-0 bg-linear-to-t from-black/50 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4 text-white">
                <div className="text-xs font-bold opacity-90 mb-1 flex items-center gap-1">
                  {viewingItem.gacha_items.type === 'drink_ticket' ? 'DRINK TICKET' : 'COUPON'}
                </div>
                <h2 className="text-xl font-bold leading-tight">{viewingItem.gacha_items.name}</h2>
              </div>
            </div>

            <div className="p-6 overflow-y-auto">
              {viewingItem.gacha_items.shops && (
                <Link 
                  href={`/shops/${viewingItem.gacha_items.shops.id}`}
                  className="flex items-center gap-2 p-3 bg-orange-50 text-orange-700 rounded-xl mb-4 hover:bg-orange-100 transition-colors"
                >
                  <div className="p-2 bg-white rounded-full shrink-0">
                    <Store className="w-4 h-4 text-orange-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-orange-500 font-bold">対象店舗</div>
                    <div className="font-bold truncate">{viewingItem.gacha_items.shops.name}</div>
                  </div>
                  <div className="text-xs font-bold bg-white px-2 py-1 rounded-md">
                    店舗へ
                  </div>
                </Link>
              )}

              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 mb-1">詳細</h3>
                  <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
                    {viewingItem.gacha_items.description || "詳細はありません"}
                  </p>
                </div>

                <div className="flex flex-wrap gap-4 pt-2 border-t border-slate-100">
                  <div>
                    <div className="text-xs text-slate-400 mb-0.5">獲得日</div>
                    <div className="text-sm font-bold text-slate-700">
                      {new Date(viewingItem.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  {viewingItem.expires_at && (
                    <div>
                      <div className="text-xs text-slate-400 mb-0.5">有効期限</div>
                      <div className={`text-sm font-bold ${viewingItem.is_used ? 'text-slate-700' : 'text-red-500'}`}>
                        {new Date(viewingItem.expires_at).toLocaleDateString()}
                      </div>
                    </div>
                  )}
                  {viewingItem.used_at && (
                    <div>
                      <div className="text-xs text-slate-400 mb-0.5">使用日</div>
                      <div className="text-sm font-bold text-slate-700">
                        {new Date(viewingItem.used_at).toLocaleDateString()}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="p-4 border-t bg-slate-50 shrink-0">
              {!viewingItem.is_used ? (
                <button
                  onClick={() => openConfirmModal(viewingItem)}
                  className="w-full py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-colors shadow-lg shadow-slate-200"
                >
                  このクーポンを使用する
                </button>
              ) : (
                <div className="w-full py-3 bg-gray-200 text-gray-500 font-bold rounded-xl text-center">
                  使用済みです
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* スタッフ確認用モーダル */}
      {confirmingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 relative">
            {!isComplete && (
              <button 
                onClick={closeConfirmModal}
                className="absolute top-4 right-4 p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors z-10"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            )}

            <div className="p-8 flex flex-col items-center text-center">
              {isComplete ? (
                <div className="py-10 flex flex-col items-center animate-in zoom-in duration-300">
                  <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6">
                    <CheckCircle2 className="w-10 h-10" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-800 mb-2">使用しました！</h3>
                  <p className="text-slate-500">ご利用ありがとうございます</p>
                </div>
              ) : (
                <>
                  <div className="w-16 h-16 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mb-6">
                    <Store className="w-8 h-8" />
                  </div>
                  
                  <div className="text-xs font-bold text-orange-500 tracking-widest mb-2">STAFF ONLY</div>
                  <h3 className="text-xl font-bold text-slate-800 mb-4">スタッフ確認画面</h3>
                  
                  <div className="bg-slate-50 p-4 rounded-xl w-full mb-8 border border-slate-100">
                    <p className="text-xs text-slate-400 mb-1">使用するクーポン</p>
                    <p className="font-bold text-slate-800">{confirmingItem.gacha_items.name}</p>
                    {confirmingItem.gacha_items.shops && (
                      <p className="text-xs text-slate-500 mt-1">対象店舗: {confirmingItem.gacha_items.shops.name}</p>
                    )}
                  </div>

                  <p className="text-sm text-slate-600 mb-6 leading-relaxed">
                    店舗スタッフの方へ<br/>
                    以下のボタンを<span className="font-bold text-orange-600">長押し</span>して<br/>
                    使用済みにしてください。
                  </p>

                  <button
                    className="relative w-full h-16 bg-slate-100 rounded-full overflow-hidden group select-none touch-none active:scale-95 transition-transform"
                    onMouseDown={() => setIsPressing(true)}
                    onMouseUp={() => setIsPressing(false)}
                    onMouseLeave={() => setIsPressing(false)}
                    onTouchStart={() => setIsPressing(true)}
                    onTouchEnd={() => setIsPressing(false)}
                  >
                    {/* プログレスバー背景 */}
                    <div 
                      className="absolute inset-0 bg-orange-500 transition-all duration-75 ease-linear"
                      style={{ width: `${progress}%` }}
                    />
                    
                    <div className="absolute inset-0 flex items-center justify-center gap-2 z-10">
                      <span className={`font-bold text-lg transition-colors ${progress > 50 ? 'text-white' : 'text-slate-600'}`}>
                        長押しで承認
                      </span>
                    </div>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
