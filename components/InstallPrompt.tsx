"use client";

import { useState, useEffect } from "react";
import { Download, X, Share, PlusSquare } from "lucide-react";
import { cn } from "@/lib/utils";

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // PWAモード（アプリとして起動中）かどうかの判定
    const isStandaloneMode = window.matchMedia("(display-mode: standalone)").matches || (window.navigator as any).standalone;
    setIsStandalone(isStandaloneMode);

    // iOS判定
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    // Android/PC用イベントリスナー
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handler);

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  // アプリ版で起動している場合、または閉じるボタンが押された場合は表示しない
  if (isStandalone || !isVisible) return null;

  // Android/PCでインストール可能な状態でない、かつiOSでもない場合は表示しない
  // (すでにインストール済み、または非対応ブラウザの場合)
  if (!deferredPrompt && !isIOS) return null;

  const handleClick = () => {
    if (isIOS) {
      setShowIOSGuide(true);
    } else if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then((choiceResult: any) => {
        if (choiceResult.outcome === "accepted") {
          setDeferredPrompt(null);
          setIsVisible(false);
        }
      });
    }
  };

  return (
    <>
      {/* インストール訴求バナー */}
      <div className="fixed bottom-20 left-4 right-4 z-40 animate-in slide-in-from-bottom-4 duration-500">
        <div className="bg-slate-900/95 backdrop-blur text-white p-4 rounded-2xl shadow-xl flex items-center gap-4 border border-white/10">
          <button 
            onClick={() => setIsVisible(false)}
            className="absolute -top-2 -right-2 bg-gray-500 text-white rounded-full p-1 hover:bg-gray-600 transition-colors shadow-md"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="bg-white p-2 rounded-xl shrink-0">
            <img src="/logo.png" alt="OKIPOKA" className="w-8 h-8 object-contain" />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="font-bold text-sm">OKIPOKAアプリ</div>
            <div className="text-xs text-gray-300">ホーム画面に追加して便利に使おう</div>
          </div>

          <button
            onClick={handleClick}
            className="bg-orange-500 text-white text-xs font-bold px-4 py-2 rounded-full hover:bg-orange-600 transition-colors shrink-0 shadow-lg shadow-orange-500/20"
          >
            入手
          </button>
        </div>
      </div>

      {/* iOS用インストールガイドモーダル */}
      {showIOSGuide && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div 
            className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl animate-in slide-in-from-bottom-10 duration-300 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              onClick={() => setShowIOSGuide(false)}
              className="absolute top-4 right-4 p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>

            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                <img src="/logo.png" alt="OKIPOKA" className="w-10 h-10 object-contain" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">ホーム画面に追加</h3>
              <p className="text-sm text-slate-500 mt-2">
                アプリとしてインストールすると、<br/>
                より快適にOKIPOKAを利用できます。
              </p>
            </div>

            <div className="space-y-4 bg-slate-50 p-4 rounded-2xl">
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 flex items-center justify-center bg-white rounded-full shadow-sm text-blue-500 shrink-0">
                  <Share className="w-4 h-4" />
                </div>
                <div className="text-sm text-slate-700">
                  <span className="font-bold">1.</span> 画面下部の<span className="font-bold">共有ボタン</span>をタップ
                </div>
              </div>
              
              <div className="w-0.5 h-4 bg-slate-200 ml-4" />

              <div className="flex items-center gap-4">
                <div className="w-8 h-8 flex items-center justify-center bg-white rounded-full shadow-sm text-slate-700 shrink-0">
                  <PlusSquare className="w-4 h-4" />
                </div>
                <div className="text-sm text-slate-700">
                  <span className="font-bold">2.</span> <span className="font-bold">ホーム画面に追加</span>を選択
                </div>
              </div>

              <div className="w-0.5 h-4 bg-slate-200 ml-4" />

              <div className="flex items-center gap-4">
                <div className="w-8 h-8 flex items-center justify-center bg-white rounded-full shadow-sm text-slate-700 shrink-0">
                  <span className="font-bold text-xs">追加</span>
                </div>
                <div className="text-sm text-slate-700">
                  <span className="font-bold">3.</span> 右上の<span className="font-bold">追加</span>をタップ
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowIOSGuide(false)}
              className="w-full mt-6 bg-slate-900 text-white font-bold py-3 rounded-xl hover:bg-slate-800 transition-colors"
            >
              閉じる
            </button>
          </div>
        </div>
      )}
    </>
  );
}
