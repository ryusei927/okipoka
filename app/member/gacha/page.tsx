"use client";

import { useEffect, useRef, useState } from "react";
import { AlertCircle, Info, X, ChevronLeft, Volume2, VolumeX, Crown } from "lucide-react";
import Link from "next/link";
import confetti from "canvas-confetti";
import { createClient } from "@/lib/supabase/client";
import { isGachaItemEligible } from "@/lib/gacha";

// 演出動画（public/ に配置）。複数用意したらここに足すとランダム再生になる。
const REVEAL_VIDEOS = ["/gacha-spin.mp4"];

type PublicGachaItem = {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  probability: number | null;
  type: string;
  stock_total: number | null;
  stock_used: number | null;
  is_monthly_limit: boolean | null;
  current_stock_used: number | null;
  shop_image_url: string | null;
};

export default function GachaPage() {
  const [spinning, setSpinning] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [revealImageLoaded, setRevealImageLoaded] = useState(false);
  const [revealImageFailed, setRevealImageFailed] = useState(false);
  
  const [showItemsList, setShowItemsList] = useState(false);
  const [gachaItems, setGachaItems] = useState<PublicGachaItem[]>([]);
  const [canPlay, setCanPlay] = useState(true);
  const [nextPlayTime, setNextPlayTime] = useState<Date | null>(null);
  const [timeLeft, setTimeLeft] = useState<string>("");
  const supabase = createClient();

  // 演出動画まわり
  const [videoAvailable, setVideoAvailable] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const [muted, setMuted] = useState(false);
  const [videoSrc] = useState(
    () => REVEAL_VIDEOS[Math.floor(Math.random() * REVEAL_VIDEOS.length)]
  );
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const pendingResultRef = useRef<any>(null);
  const videoEndedRef = useRef(false);

  const eligibleItems = gachaItems.filter(isGachaItemEligible);
  const totalWeight = eligibleItems.reduce((sum, item) => sum + (item.probability ?? 0), 0);
  const formatProbabilityPct = (item: PublicGachaItem) => {
    if (!isGachaItemEligible(item)) return "—";
    const w = item.probability ?? 0;
    if (!totalWeight || !w) return "0%";
    const pct = Math.round((w / totalWeight) * 1000) / 10;
    return `${Number.isInteger(pct) ? pct.toFixed(0) : pct.toFixed(1)}%`;
  };

  const formatRemainingStock = (item: PublicGachaItem) => {
    if (item.stock_total === null || item.stock_total === undefined) return "無制限";
    const used = Number(item.current_stock_used ?? item.stock_used ?? 0);
    const remaining = Math.max(0, item.stock_total - used);
    return String(remaining);
  };

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
      const { data, error } = await supabase.rpc("get_public_gacha_items");

      if (!error) {
        setGachaItems((data ?? []) as PublicGachaItem[]);
        return;
      }

      const { data: legacy } = await supabase
        .from("gacha_items")
        .select("id,name,description,image_url,probability,type,stock_total,stock_used,is_monthly_limit,shops(image_url)")
        .eq("is_active", true)
        .is("deleted_at", null)
        .order("probability", { ascending: false });

      if (legacy) {
        const mapped: PublicGachaItem[] = (legacy as any[]).map((item) => ({
          id: item.id,
          name: item.name,
          description: item.description ?? null,
          image_url: item.image_url ?? null,
          probability: item.probability ?? null,
          type: item.type,
          stock_total: item.stock_total ?? null,
          stock_used: item.stock_used ?? null,
          is_monthly_limit: item.is_monthly_limit ?? null,
          current_stock_used: item.stock_used ?? 0,
          shop_image_url: item.shops?.image_url ?? null,
        }));
        setGachaItems(mapped);
      }
    };
    fetchGachaItems();
  }, []);

  useEffect(() => {
    setRevealImageLoaded(false);
    setRevealImageFailed(false);
  }, [result?.image_url]);

  const fireConfetti = () => {
    confetti({
      particleCount: 55,
      spread: 50,
      startVelocity: 30,
      gravity: 1.1,
      scalar: 0.9,
      ticks: 110,
      origin: { y: 0.65 },
      colors: ["#fbbf24", "#f59e0b", "#ffffff"],
    });
  };

  // 動画の再生終了 と 抽選結果 の両方が揃ったら景品を表示する
  const finishVideoReveal = () => {
    if (!videoEndedRef.current || !pendingResultRef.current) return;
    const item = pendingResultRef.current;
    pendingResultRef.current = null;
    setShowVideo(false);
    setSpinning(false);
    setResult(item);
    setRevealed(true);
    if (item && item.type !== "none") {
      fireConfetti();
    }
  };

  const spinGacha = async () => {
    clearTimers();
    setError(null);
    setResult(null);
    setRevealed(false);
    setSpinning(true);
    setRevealImageLoaded(false);
    setRevealImageFailed(false);
    pendingResultRef.current = null;
    videoEndedRef.current = false;

    const usingVideo = videoAvailable;

    // 動画演出: PUSHのタップを起点に即再生（音あり、弾かれたらミュートで再試行）
    if (usingVideo) {
      setShowVideo(true);
      const v = videoRef.current;
      if (v) {
        try {
          v.currentTime = 0;
          v.muted = muted;
          const p = v.play();
          if (p && typeof p.then === "function") {
            p.catch(() => {
              v.muted = true;
              setMuted(true);
              v.play().catch(() => {});
            });
          }
        } catch {
          // ignore
        }
      }
      // endedイベントが来ない端末向けの安全タイマー
      const tMax = window.setTimeout(() => {
        videoEndedRef.current = true;
        finishVideoReveal();
      }, 12000);
      timersRef.current.push(tMax);
    }

    const startedAt = Date.now();

    try {
      const res = await fetch("/api/gacha/spin", {
        method: "POST",
      });
      const data = await res.json();

      if (!res.ok) {
        const raw = String(data.error || "");
        if (raw.includes("Subscription expired")) {
          throw new Error("プレミアム会員の有効期限が切れています。更新してください。");
        }
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

      // 動画演出モード: 動画のクライマックス（再生終了）で景品を表示
      if (usingVideo) {
        pendingResultRef.current = data.item;
        finishVideoReveal();
        return;
      }

      // シンプル＆上品な演出: PUSH→短いローディング→結果がフェードイン
      const minSpinMs = 1500;
      const elapsed = Date.now() - startedAt;
      const waitMs = Math.max(0, minSpinMs - elapsed);
      if (waitMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, waitMs));
      }

      setSpinning(false);
      setResult(data.item);
      setRevealed(true);
      if (data.item && data.item.type !== "none") {
        fireConfetti();
      }

    } catch (e: any) {
      setError(e.message);
      setSpinning(false);
      setRevealed(false);
      setShowVideo(false);
      pendingResultRef.current = null;
      const v = videoRef.current;
      if (v) {
        try { v.pause(); } catch { /* ignore */ }
      }
    }
  };

  const reset = () => {
    clearTimers();
    setResult(null);
    setRevealed(false);
    setError(null);
    setShowVideo(false);
    pendingResultRef.current = null;
    videoEndedRef.current = false;
    const v = videoRef.current;
    if (v) {
      try {
        v.pause();
        v.currentTime = 0;
      } catch {
        // ignore
      }
    }
  };

  return (
    <div className="relative w-full h-dvh overflow-hidden bg-gradient-to-b from-white to-[#f3f3f5]">
      {/* 戻るボタン */}
      <Link 
        href="/member" 
        className="absolute top-4 left-4 z-40 rounded-full bg-white p-3 text-gray-600 shadow-sm ring-1 ring-gray-200 transition-all hover:bg-gray-50 hover:text-gray-900 pointer-events-auto"
      >
        <ChevronLeft className="w-6 h-6" />
      </Link>

      {/* 景品一覧ボタン */}
      <button
        onClick={() => setShowItemsList(true)}
        className="absolute top-4 right-4 z-40 rounded-full bg-white p-3 text-gray-600 shadow-sm ring-1 ring-gray-200 transition-all hover:bg-gray-50 hover:text-gray-900 pointer-events-auto"
        aria-label="景品一覧"
      >
        <Info className="w-6 h-6" />
      </button>

      {/* 背景の柔らかいグロー（ガラスが拾う色味） */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-1/2 h-[420px] w-[420px] -translate-x-1/2 -translate-y-[65%] rounded-full bg-orange-300/30 blur-[120px]" />
        <div className="absolute left-1/2 top-1/2 h-[300px] w-[300px] -translate-x-[75%] -translate-y-[15%] rounded-full bg-rose-200/35 blur-[110px]" />
        <div className="absolute left-1/2 top-1/2 h-[300px] w-[300px] -translate-x-[15%] -translate-y-[5%] rounded-full bg-amber-200/35 blur-[110px]" />
      </div>

      {/* 演出動画（オリパ風）。読み込めない場合は videoAvailable=false でカプセル演出にフォールバック */}
      <video
        ref={videoRef}
        src={videoSrc}
        playsInline
        muted={muted}
        preload="auto"
        onLoadedData={() => setVideoAvailable(true)}
        onError={() => {
          setVideoAvailable(false);
          if (showVideo) {
            videoEndedRef.current = true;
            finishVideoReveal();
          }
        }}
        onEnded={() => {
          videoEndedRef.current = true;
          finishVideoReveal();
        }}
        className={`absolute inset-0 z-30 w-full h-full object-cover bg-black transition-opacity duration-300 ${
          showVideo ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      />

      {/* ミュート切替（演出中のみ） */}
      {showVideo && (
        <button
          onClick={() => {
            const next = !muted;
            setMuted(next);
            const v = videoRef.current;
            if (v) v.muted = next;
          }}
          className="absolute top-4 right-4 z-40 bg-white/90 backdrop-blur-sm p-3 rounded-full shadow-lg hover:bg-white transition-all text-slate-600 pointer-events-auto"
          aria-label={muted ? "音を出す" : "ミュート"}
        >
          {muted ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
        </button>
      )}

      {/* 抽選中ローディング（シンプル＆上品） */}
      {spinning && !showVideo && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/35 backdrop-blur-[2px] pointer-events-none animate-in fade-in duration-200">
          <div className="flex flex-col items-center gap-4">
            <div className="h-14 w-14 rounded-full border-[3px] border-white/25 border-t-white animate-spin" />
            <p className="text-sm font-bold tracking-[0.3em] text-white drop-shadow-md">
              抽選中
            </p>
          </div>
        </div>
      )}

      {/* コンテンツエリア */}
      <div className="relative z-10 flex h-full flex-col items-center justify-center px-6 pointer-events-none">
        <div className="flex w-full max-w-xs flex-col items-center text-center pointer-events-auto">
          <p className="text-[11px] font-semibold tracking-[0.3em] text-orange-500">
            DAILY GACHA
          </p>

          {/* グラスカプセル */}
          <div className="relative my-8 h-48 w-48">
            {/* 後光 */}
            <div className="absolute -inset-5 rounded-full bg-gradient-to-tr from-orange-300/40 via-amber-200/30 to-rose-200/40 blur-2xl" />
            {/* 回転する装飾リング */}
            <div className="gacha-spin-slow absolute -inset-1 rounded-full border border-dashed border-orange-300/50" />
            {/* ガラス本体 */}
            <div className="absolute inset-0 overflow-hidden rounded-full bg-white/40 ring-1 ring-white/60 shadow-[0_24px_70px_rgba(15,23,42,0.14),inset_0_1px_3px_rgba(255,255,255,0.9)] backdrop-blur-xl">
              {/* 光沢 */}
              <div className="absolute inset-0 bg-gradient-to-b from-white/70 via-white/10 to-transparent" />
              <div className="absolute left-7 top-6 h-10 w-16 -rotate-12 rounded-full bg-white/60 blur-md" />
              {/* トランプのキング（K）カード */}
              <div className="gacha-bob absolute left-1/2 top-1/2 flex h-28 w-20 -translate-x-1/2 -translate-y-1/2 -rotate-6 flex-col justify-between rounded-xl bg-white p-2 shadow-[0_10px_24px_rgba(15,23,42,0.18)] ring-1 ring-black/5">
                <div className="text-left text-[13px] font-bold leading-[0.9] text-gray-900">
                  K<span className="block text-gray-900">♠</span>
                </div>
                <Crown className="mx-auto h-7 w-7 text-orange-500" strokeWidth={2} />
                <div className="rotate-180 text-left text-[13px] font-bold leading-[0.9] text-gray-900">
                  K<span className="block text-gray-900">♠</span>
                </div>
              </div>
            </div>
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-gray-950">今日のガチャ</h1>
          <p className="mt-2 text-sm text-gray-500">1日1回、チャンスをGET</p>

          {/* アクション */}
          <div className="mt-8 w-full">
            {!result ? (
              canPlay ? (
                <>
                  <button
                    onClick={spinGacha}
                    disabled={spinning}
                    className="flex w-full items-center justify-center rounded-full bg-orange-500 px-8 py-4 text-base font-bold text-white shadow-[0_10px_30px_rgba(249,115,22,0.35)] transition-all hover:bg-orange-600 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {spinning ? "抽選中..." : "ガチャを引く"}
                  </button>
                  <p className="mt-3 text-[11px] leading-relaxed text-gray-400">
                    ※クーポンによって有効期限が異なります。<br />有効期限をしっかりご確認ください。
                  </p>
                </>
              ) : (
                <div className="rounded-2xl bg-white px-6 py-4 text-center shadow-sm ring-1 ring-gray-100 animate-in fade-in slide-in-from-bottom-2 duration-500">
                  <div className="text-xs font-medium text-gray-400">次回のガチャまで</div>
                  <div className="mt-1 font-mono text-2xl tracking-widest text-gray-800">
                    {timeLeft}
                  </div>
                </div>
              )
            ) : (
              <button
                onClick={reset}
                className="w-full rounded-full bg-white px-8 py-4 text-base font-bold text-gray-700 shadow-sm ring-1 ring-gray-200 transition-colors hover:bg-gray-50"
              >
                もう一度見る
              </button>
            )}
          </div>
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
                    href={`/shops#shop-${result.shop_id}`}
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
                    ) : (item.image_url || item.shop_image_url) ? (
                      <img src={item.image_url || item.shop_image_url || ""} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-2xl">🎁</span>
                    )}
                  </div>
                  <div>
                    <div className="font-bold text-slate-800 text-sm">{item.name}</div>
                    {item.description && (
                      <div className="text-xs text-slate-500 mt-0.5">{item.description}</div>
                    )}
                    <div className="text-xs text-slate-500 mt-1 flex flex-wrap gap-x-3 gap-y-1">
                      <span>確率: {formatProbabilityPct(item)}</span>
                      <span>残り: {formatRemainingStock(item)}</span>
                    </div>
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
