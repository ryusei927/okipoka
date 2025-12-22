"use client";

import { useEffect, useRef, useState } from "react";
import { AlertCircle, Info, X, ChevronLeft } from "lucide-react";
import Link from "next/link";
import confetti from "canvas-confetti";
import { createClient } from "@/lib/supabase/client";

export default function GachaPage() {
  const [spinning, setSpinning] = useState(false);
  const [dropping, setDropping] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [revealImageLoaded, setRevealImageLoaded] = useState(false);
  const [revealImageFailed, setRevealImageFailed] = useState(false);
  
  const [showItemsList, setShowItemsList] = useState(false);
  const [gachaItems, setGachaItems] = useState<any[]>([]);
  const [canPlay, setCanPlay] = useState(true);
  const [nextPlayTime, setNextPlayTime] = useState<Date | null>(null);
  const [timeLeft, setTimeLeft] = useState<string>("");
  const supabase = createClient();

  const timersRef = useRef<number[]>([]);
  const countdownRef = useRef<any>(null);

  const clearTimers = () => {
    for (const id of timersRef.current) window.clearTimeout(id);
    timersRef.current = [];
    if (countdownRef.current) clearInterval(countdownRef.current);
  };

  useEffect(() => {
    return () => clearTimers();
  }, []);

  // ユーザーの状態（本日プレイ済みか）を確認
  useEffect(() => {
    const checkUserStatus = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 管理者は無制限
      if (user.email === 'okipoka.jp@gmail.com') {
        setCanPlay(true);
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("last_gacha_at")
        .eq("id", user.id)
        .single();

      if (profile?.last_gacha_at) {
        const lastDate = new Date(profile.last_gacha_at);
        const now = new Date();
        
        // JSTでの日付比較
        const lastJst = lastDate.toLocaleDateString("ja-JP", { timeZone: "Asia/Tokyo" });
        const nowJst = now.toLocaleDateString("ja-JP", { timeZone: "Asia/Tokyo" });

        if (lastJst === nowJst) {
          setCanPlay(false);
          
          // 次回プレイ可能時間（JST翌日0時）を設定
          const nowJstObj = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Tokyo" }));
          const tomorrow = new Date(nowJstObj);
          tomorrow.setDate(tomorrow.getDate() + 1);
          tomorrow.setHours(0, 0, 0, 0);
          setNextPlayTime(tomorrow);
        }
      }
    };
    checkUserStatus();
  }, []);

  // カウントダウン処理
  useEffect(() => {
    if (!nextPlayTime) return;

    const updateTimer = () => {
      const nowJstObj = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Tokyo" }));
      const diff = nextPlayTime.getTime() - nowJstObj.getTime();

      if (diff <= 0) {
        setCanPlay(true);
        setNextPlayTime(null);
        setTimeLeft("");
        return;
      }

      const h = Math.floor(diff / (1000 * 60 * 60));
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeLeft(`${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
    };

    updateTimer(); // 初回実行
    countdownRef.current = setInterval(updateTimer, 1000);

    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [nextPlayTime]);

  useEffect(() => {
    const fetchGachaItems = async () => {
      const { data } = await supabase
        .from("gacha_items")
        .select("*, shops(image_url)")
        .eq("is_active", true)
        .is("deleted_at", null)
        .order("probability", { ascending: false });
      if (data) setGachaItems(data);
    };
    fetchGachaItems();
  }, []);

  useEffect(() => {
    setRevealImageLoaded(false);
    setRevealImageFailed(false);
  }, [result?.image_url]);

  const spinGacha = async () => {
    clearTimers();
    setError(null);
    setResult(null);
    setRevealed(false);
    setDropping(false);
    setSpinning(true);
    setRevealImageLoaded(false);
    setRevealImageFailed(false);

    const startedAt = Date.now();

    try {
      const res = await fetch("/api/gacha/spin", {
        method: "POST",
      });
      const data = await res.json();

      if (!res.ok) {
        const raw = String(data.error || "");
        if (raw.includes("Subscription")) {
          throw new Error("プレミアム会員のみガチャを回せます");
        }
        if (raw.includes("Already played")) {
          throw new Error("本日のガチャはすでに回しています。また明日挑戦してね！");
        }
        if (raw.includes("Unauthorized")) {
          throw new Error("ログインが必要です");
        }
        throw new Error(raw || "ガチャの実行に失敗しました");
      }

      if (data?.item?.image_url) {
        try {
          const img = new window.Image();
          img.src = data.item.image_url;
        } catch {
          // ignore
        }
      }

      // ガチャ成功時、次回プレイ時間を設定してボタンを無効化
      // 管理者以外の場合のみ
      const { data: { user } } = await supabase.auth.getUser();
      if (user && user.email !== 'okipoka.jp@gmail.com') {
        setCanPlay(false);
        const now = new Date();
        const nowJstObj = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Tokyo" }));
        const tomorrow = new Date(nowJstObj);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        setNextPlayTime(tomorrow);
      }

      const minSpinMs = 2600;
      const elapsed = Date.now() - startedAt;
      const waitMs = Math.max(0, minSpinMs - elapsed);
      if (waitMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, waitMs));
      }

      setDropping(true);

      const t1 = window.setTimeout(() => {
        setSpinning(false);
      }, 450);
      const t2 = window.setTimeout(() => {
        setResult(data.item);
      }, 650);
      const t3 = window.setTimeout(() => {
        setRevealed(true);
        setDropping(false);
        if (data.item && data.item.type !== "none") {
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
            colors: ["#fbbf24", "#f87171", "#60a5fa", "#34d399", "#a78bfa"],
          });
        }
      }, 1350);
      timersRef.current.push(t1, t2, t3);

    } catch (e: any) {
      setError(e.message);
      setSpinning(false);
      setDropping(false);
      setRevealed(false);
    }
  };

  const reset = () => {
    clearTimers();
    setResult(null);
    setRevealed(false);
    setDropping(false);
    setError(null);
  };

  return (
    <div className="relative w-full h-dvh bg-[#facc15] overflow-hidden">
      {/* 戻るボタン */}
      <Link 
        href="/" 
        className="absolute top-4 left-4 z-40 bg-white/90 backdrop-blur-sm p-3 rounded-full shadow-lg hover:bg-white hover:scale-105 transition-all text-slate-600 pointer-events-auto"
      >
        <ChevronLeft className="w-6 h-6" />
      </Link>

      {/* 景品一覧ボタン */}
      <button
        onClick={() => setShowItemsList(true)}
        className="absolute top-4 right-4 z-40 bg-white/90 backdrop-blur-sm p-3 rounded-full shadow-lg hover:bg-white hover:scale-105 transition-all text-slate-600 pointer-events-auto"
        aria-label="景品一覧"
      >
        <Info className="w-6 h-6" />
      </button>

      {/* 背景画像エリア（画面いっぱい） */}
      <div className="absolute inset-0 w-full h-full">
        <img
          src="/gacha-pc.png"
          alt="Gacha Machine"
          className="hidden md:block w-full h-full object-cover object-center scale-105"
        />
        <img
          src="/gacha-mobile.png"
          alt="Gacha Machine"
          className="block md:hidden w-full h-full object-cover object-center scale-105"
        />
      </div>

      {/* コンテンツエリア */}
      <div className="relative w-full h-full flex flex-col items-center justify-center pointer-events-none">
        
        {/* 排出されるカプセル */}
        <div 
          className={`absolute left-1/2 -translate-x-1/2 w-32 h-32 z-20 transition-all duration-500 ease-out
            ${dropping ? "opacity-100 bottom-[25%] scale-110 rotate-12" : "opacity-0 bottom-[35%] scale-50 rotate-0"}
          `}
        >
            <div
              className={
                "w-full h-full rounded-full border-4 border-white/40 shadow-2xl bg-orange-300 relative overflow-hidden " +
                (revealed ? "capsule-open" : "")
              }
            >
              <div className="absolute top-3 left-5 w-8 h-4 bg-white/40 rounded-full -rotate-12" />
              
              {revealed && (
                <div className="absolute inset-0 flex items-center justify-center bg-white">
                </div>
              )}
            </div>
        </div>

        {/* 操作ボタン */}
        <div className="absolute bottom-[10%] left-1/2 -translate-x-1/2 w-64 z-30 pointer-events-auto flex flex-col items-center gap-4">
            {!result ? (
              canPlay ? (
                <>
                  <button
                    onClick={spinGacha}
                    disabled={spinning}
                    className="w-full bg-linear-to-b from-amber-400 to-amber-600 text-white font-black py-5 px-8 rounded-full shadow-[0_6px_0_rgb(180,83,9)] hover:shadow-[0_3px_0_rgb(180,83,9)] hover:translate-y-0.75 active:translate-y-1.5 active:shadow-none transition-all text-xl tracking-wider border-4 border-white/30"
                  >
                    {spinning ? "SPINNING..." : "PUSH !"}
                  </button>
                  <p className="text-[10px] text-white/80 text-center font-medium bg-black/20 px-3 py-1 rounded-full backdrop-blur-sm">
                    ※クーポンによって有効期限が異なります。<br/>有効期限をしっかりご確認ください。
                  </p>
                </>
              ) : (
                <div className="w-full bg-slate-100/90 backdrop-blur-sm text-slate-500 font-bold py-4 px-6 rounded-full border-4 border-slate-200 shadow-lg text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="text-xs mb-1 font-medium text-slate-400">次回のガチャまで</div>
                  <div className="text-2xl text-slate-600 font-mono tracking-widest">
                     {timeLeft}
                  </div>
                </div>
              )
            ) : (
              <button
                onClick={reset}
                className="w-full bg-white text-slate-700 font-bold py-4 px-8 rounded-full border-4 border-slate-200 shadow-xl hover:bg-slate-50 transition-all text-lg"
              >
                もう一度
              </button>
            )}
        </div>
      </div>

      {/* 結果モーダル */}
      {result && revealed ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="p-8 flex flex-col items-center text-center">
              <div className="w-32 h-32 mb-6 relative rounded-full overflow-hidden border-4 border-white shadow-lg flex items-center justify-center bg-slate-50">
                  {result.type === "none" ? (
                    <span className="text-6xl">😢</span>
                  ) : (result.image_url || result.shop_image_url) && !revealImageFailed ? (
                    <img
                      src={result.image_url || result.shop_image_url}
                      alt={result.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-6xl">🎁</span>
                  )}
              </div>
              
              <div className="text-sm font-bold text-amber-500 tracking-widest mb-2">RESULT</div>
              <h2 className="text-2xl font-bold text-slate-800 mb-2">{result.type === "none" ? "ざんねん…" : result.name}</h2>
              
              {result.type !== "none" && (
                <div className="mb-4 px-3 py-1 bg-red-50 text-red-500 text-xs font-bold rounded-full inline-block border border-red-100">
                  有効期限: {(() => {
                    const d = new Date();
                    d.setDate(d.getDate() + (result.expires_days ?? 30));
                    return d.toLocaleDateString();
                  })()}
                </div>
              )}

              {result.description && (
                <p className="text-slate-600 text-sm mb-8 leading-relaxed">{result.description}</p>
              )}

              <div className="flex flex-col gap-3 w-full">
                {result.type !== "none" && (
                  <Link
                    href="/member/items"
                    className="w-full py-3 bg-amber-100 text-amber-800 font-bold rounded-xl hover:bg-amber-200 transition-colors"
                  >
                    獲得アイテムを確認
                  </Link>
                )}
                {result.shop_id && (
                  <Link
                    href={`/shops/${result.shop_id}`}
                    className="w-full py-3 bg-white border-2 border-amber-100 text-amber-600 font-bold rounded-xl hover:bg-amber-50 transition-colors"
                  >
                    店舗ページを見る
                  </Link>
                )}
                <button
                  onClick={reset}
                  className="w-full py-3 text-slate-500 font-medium hover:text-slate-800 transition-colors"
                >
                  閉じる
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* 景品一覧モーダル */}
      {showItemsList && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl w-full max-w-md max-h-[80vh] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 flex flex-col">
            <div className="p-4 border-b flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-lg text-slate-800">ラインナップ</h3>
              <button onClick={() => setShowItemsList(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            <div className="overflow-y-auto p-4 space-y-3">
              {gachaItems.map((item) => (
                <div key={item.id} className="flex items-center gap-4 p-3 rounded-xl border border-slate-100 bg-slate-50/50">
                  <div className="w-12 h-12 shrink-0 bg-white rounded-lg border border-slate-100 flex items-center justify-center overflow-hidden">
                    {item.type === "none" ? (
                      <span className="text-2xl">😢</span>
                    ) : (item.image_url || item.shops?.image_url) ? (
                      <img src={item.image_url || item.shops?.image_url} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-2xl">🎁</span>
                    )}
                  </div>
                  <div>
                    <div className="font-bold text-slate-800 text-sm">{item.name}</div>
                    {item.description && (
                      <div className="text-xs text-slate-500 mt-0.5">{item.description}</div>
                    )}
                  </div>
                </div>
              ))}
              {gachaItems.length === 0 && (
                <div className="text-center py-8 text-slate-400 text-sm">
                  現在開催中のガチャはありません
                </div>
              )}
            </div>
            <div className="p-4 border-t bg-slate-50 text-center">
              <button
                onClick={() => setShowItemsList(false)}
                className="w-full py-3 bg-slate-800 text-white font-bold rounded-xl hover:bg-slate-700 transition-colors"
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 w-full max-w-md px-4 z-50">
          <div className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-100 p-4 rounded-xl shadow-lg text-sm font-medium">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        </div>
      )}


    </div>
  );
}
