"use client";

import { useEffect, useRef, useState } from "react";
import { AlertCircle } from "lucide-react";
import Link from "next/link";
import confetti from "canvas-confetti";

export default function GachaPage() {
  const [spinning, setSpinning] = useState(false);
  const [dropping, setDropping] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [revealImageLoaded, setRevealImageLoaded] = useState(false);
  const [revealImageFailed, setRevealImageFailed] = useState(false);

  const timersRef = useRef<number[]>([]);
  const clearTimers = () => {
    for (const id of timersRef.current) window.clearTimeout(id);
    timersRef.current = [];
  };

  useEffect(() => {
    return () => clearTimers();
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
          throw new Error("本日のガチャはすでに回しています");
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
        <div className="absolute bottom-[10%] left-1/2 -translate-x-1/2 w-64 z-30 pointer-events-auto">
            {!result ? (
              <button
                onClick={spinGacha}
                disabled={spinning}
                className="w-full bg-linear-to-b from-amber-400 to-amber-600 text-white font-black py-5 px-8 rounded-full shadow-[0_6px_0_rgb(180,83,9)] hover:shadow-[0_3px_0_rgb(180,83,9)] hover:translate-y-0.75 active:translate-y-1.5 active:shadow-none transition-all text-xl tracking-wider border-4 border-white/30"
              >
                {spinning ? "SPINNING..." : "PUSH !"}
              </button>
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
              <div className="w-32 h-32 mb-6 relative">
                  {result.type === "none" ? (
                    <span className="text-6xl">😢</span>
                  ) : result.image_url && !revealImageFailed ? (
                    <img
                      src={result.image_url}
                      alt={result.name}
                      className="w-full h-full object-contain drop-shadow-md"
                    />
                  ) : (
                    <span className="text-6xl">🎁</span>
                  )}
              </div>
              
              <div className="text-sm font-bold text-amber-500 tracking-widest mb-2">RESULT</div>
              <h2 className="text-2xl font-bold text-slate-800 mb-4">{result.type === "none" ? "ざんねん…" : result.name}</h2>
              
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
