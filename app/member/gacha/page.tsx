"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AlertCircle } from "lucide-react";
import Link from "next/link";

export default function GachaPage() {
  const bgSrc = "/gacha.png";

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

  const capsules = useMemo(
    () => [
      { className: "bg-orange-300/80" },
      { className: "bg-rose-300/80" },
      { className: "bg-amber-300/80" },
      { className: "bg-blue-300/80" },
      { className: "bg-emerald-300/80" },
      { className: "bg-violet-300/80" },
      { className: "bg-red-300/80" },
      { className: "bg-cyan-300/80" },
      { className: "bg-indigo-300/80" },
      { className: "bg-yellow-300/80" },
      { className: "bg-lime-300/80" },
      { className: "bg-sky-300/80" },
      { className: "bg-orange-300/80" },
      { className: "bg-rose-300/80" },
      { className: "bg-amber-300/80" },
      { className: "bg-blue-300/80" },
    ],
    []
  );

  const idleAnglesDeg = useMemo(() => {
    const n = capsules.length;
    return Array.from({ length: n }, (_, i) => {
      const base = (360 / n) * i;
      const jitter = [0, 12, -9, 20, -16, 7, 11, -6, 16, -14, 9, -8][i % 12] ?? 0;
      return base + jitter;
    });
  }, [capsules.length]);

  const spinMotion = useMemo(() => {
    const n = capsules.length;
    return Array.from({ length: n }, (_, i) => {
      const duration = 820 + (i % 6) * 95 + (i % 2) * 55;
      const delay = -i * 70;
      const variant = i % 3 === 0 ? "orbitSlow" : "orbit";
      return { duration, delay, variant };
    });
  }, [capsules.length]);

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

      // 画像は演出中に先読みして「白抜け」を減らす
      if (data?.item?.image_url) {
        try {
          const img = new window.Image();
          img.src = data.item.image_url;
        } catch {
          // ignore
        }
      }

      // 抽選中の“ため”を作る（最低時間だけ回してから落下へ）
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
    <div className="relative min-h-[calc(100vh-64px)]">
      <div
        className="absolute inset-0 bg-transparent"
        style={{ backgroundImage: `url(${bgSrc})`, backgroundSize: "cover", backgroundPosition: "center" }}
        aria-hidden
      />

      <div className="relative max-w-md mx-auto px-6 py-10 min-h-[calc(100vh-64px)] flex flex-col items-center justify-center">
        <h1 className="text-xl font-bold mb-8 text-center text-slate-800 tracking-wider">DAILY GACHA</h1>

        {/* ガチャ筐体 */}
        <div className="w-full max-w-sm" aria-live="polite">
          <div className="relative mx-auto w-[320px] max-w-full">
            {/* ドーム */}
            <div className="relative mx-auto w-72 h-72">
              <div className="absolute inset-0 rounded-full bg-white/60 border border-white/50 shadow-inner backdrop-blur-sm" />
              <div className="absolute inset-4 rounded-full bg-white/20" />
              <div className="absolute inset-0 rounded-full dome-sheen" />

              {/* 内部回転カプセル */}
              <div className="absolute inset-6 rounded-full overflow-hidden">
                {capsules.map((c, i) => (
                  <div
                    key={i}
                    className="absolute left-1/2 top-1/2"
                    style={
                      spinning
                        ? {
                            animation: `${spinMotion[i].variant} ${spinMotion[i].duration}ms linear infinite`,
                            animationDelay: `${spinMotion[i].delay}ms`,
                          }
                        : {
                            transform: `translate(-50%, -50%) rotate(${idleAnglesDeg[i]}deg) translateX(96px)`,
                          }
                    }
                  >
                    <div
                      className={
                        "w-10 h-10 rounded-full border border-white/40 shadow-sm " +
                        c.className
                      }
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* ベース */}
            <div className="relative mx-auto w-72 max-w-full -mt-8 z-10">
              <div className="rounded-3xl bg-white/80 backdrop-blur-md border border-white/60 shadow-xl overflow-hidden">
                <div className="p-6">
                  {/* 取り出し口 */}
                  <div className="relative mb-6">
                    <div className="rounded-2xl bg-slate-50/50 border border-slate-100 p-4 min-h-[100px] flex items-center justify-center shadow-inner">
                      <div
                        className={
                          "relative w-20 h-20 " +
                          (dropping ? "capsule-drop" : "")
                        }
                        aria-hidden={!dropping && !revealed}
                      >
                        <div
                          className={
                            "absolute inset-0 rounded-full border border-white/60 shadow-md bg-orange-300 " +
                            (revealed ? "capsule-open" : "")
                          }
                        />
                        {revealed ? (
                          <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
                            {result ? (
                              result.type === "none" ? (
                                <span className="text-2xl">😢</span>
                              ) : result.image_url && !revealImageFailed ? (
                                <div className="relative w-20 h-20">
                                  {!revealImageLoaded ? (
                                    <div className="absolute inset-0 flex items-center justify-center">
                                      <span className="text-2xl">🎁</span>
                                    </div>
                                  ) : null}
                                  <img
                                    src={result.image_url}
                                    alt={result.name || "景品"}
                                    className="absolute inset-0 w-full h-full object-contain"
                                    loading="eager"
                                    onLoad={() => setRevealImageLoaded(true)}
                                    onError={() => {
                                      setRevealImageFailed(true);
                                      setRevealImageLoaded(false);
                                    }}
                                  />
                                </div>
                              ) : (
                                <span className="text-2xl">🎁</span>
                              )
                            ) : null}
                          </div>
                        ) : null}
                      </div>
                    </div>
                    <div className="mt-3 text-xs text-slate-400 text-center font-medium">
                      {spinning ? "抽選中..." : result ? "結果" : "TAP TO SPIN"}
                    </div>
                  </div>

                  {/* ボタン */}
                  {!result ? (
                    <button
                      onClick={spinGacha}
                      disabled={spinning}
                      className="w-full bg-slate-900 text-white font-bold py-3.5 px-6 rounded-xl shadow-lg hover:bg-slate-800 hover:shadow-xl active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm tracking-wide"
                    >
                      {spinning ? "SPINNING..." : "ガチャを回す"}
                    </button>
                  ) : (
                    <button
                      onClick={reset}
                      className="w-full bg-white text-slate-700 font-bold py-3.5 px-6 rounded-xl border border-slate-200 shadow-sm hover:bg-slate-50 transition-all text-sm"
                    >
                      もう一度
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {result && revealed ? (
          <div className="w-full max-w-sm mt-6">
            <div className="rounded-2xl overflow-hidden border border-slate-100 bg-white shadow-lg">
              <div className="px-6 py-4 bg-slate-50 border-b border-slate-100">
                <div className="text-xs font-bold text-slate-400 tracking-widest">RESULT</div>
                <div className="mt-1 text-lg font-bold text-slate-800 leading-tight break-words">
                  {result.type === "none" ? "ざんねん…" : result.name}
                </div>
              </div>
              <div className="px-6 py-6">
                {result.type === "none" ? (
                  <div className="text-sm text-slate-600">明日また挑戦してね。</div>
                ) : (
                  <>
                    {result.description ? (
                      <div className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
                        {result.description}
                      </div>
                    ) : (
                      <div className="text-sm text-slate-600">当たり！</div>
                    )}
                    <Link
                      href="/member/items"
                      className="mt-6 block p-4 bg-amber-50 border border-amber-100 rounded-xl hover:bg-amber-100 transition-colors text-center"
                    >
                      <p className="text-sm font-medium text-amber-800">獲得アイテムを確認する</p>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        ) : null}

        {error && (
          <div className="flex items-center gap-2 text-red-600 bg-red-50 p-4 rounded-xl mb-6 text-sm font-medium">
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </div>
        )}
        <style jsx>{`
          .dome-sheen {
            background: linear-gradient(
              135deg,
              rgba(255, 255, 255, 0.1) 0%,
              rgba(255, 255, 255, 0.4) 50%,
              rgba(255, 255, 255, 0.1) 100%
            );
            pointer-events: none;
          }

          /* capsules orbit */
          @keyframes orbit {
            0% {
              transform: translate(-50%, -50%) rotate(0deg) translateX(96px) rotate(0deg);
            }
            100% {
              transform: translate(-50%, -50%) rotate(360deg) translateX(96px) rotate(-360deg);
            }
          }

          @keyframes orbitSlow {
            0% {
              transform: translate(-50%, -50%) rotate(0deg) translateX(84px) rotate(0deg);
            }
            100% {
              transform: translate(-50%, -50%) rotate(360deg) translateX(84px) rotate(-360deg);
            }
          }

          /* capsule drop */
          @keyframes drop {
            0% {
              transform: translateY(-28px) scale(0.85);
              opacity: 0;
            }
            40% {
              transform: translateY(0px) scale(1);
              opacity: 1;
            }
            65% {
              transform: translateY(6px) scale(0.98);
            }
            100% {
              transform: translateY(0px) scale(1);
              opacity: 1;
            }
          }
          .capsule-drop {
            animation: drop 520ms ease-out both;
          }

          @keyframes open {
            0% {
              transform: scale(1);
            }
            100% {
              transform: scale(1);
            }
          }
          .capsule-open {
            animation: open 1ms linear both;
          }

          @media (prefers-reduced-motion: reduce) {
            .orbit-a,
            .orbit-b,
            .orbit-c,
            .orbit-d,
            .orbit-e,
            .orbit-f,
            .capsule-drop {
              animation: none !important;
            }
          }
        `}</style>
      </div>
    </div>
  );
}