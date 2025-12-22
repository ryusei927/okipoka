"use client";

import { useState, useEffect } from "react";
import { Download, X, Share, PlusSquare, AlertCircle } from "lucide-react";
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
      {/* インストール訴求バナー（埋め込み型） */}
      <div className="w-full max-w-md mx-auto px-4 mt-7 mb-4">
        <div className="bg-linear-to-r from-slate-900 to-slate-800 text-white p-4 rounded-2xl shadow-lg flex items-center gap-4 border border-slate-700/50">
          <div className="bg-white p-2 rounded-xl shrink-0">
            <img src="/logo.png" alt="OKIPOKA" className="w-10 h-10 object-contain" />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="font-bold text-base">OKIPOKAアプリ</div>
            <div className="text-xs text-gray-300 mt-0.5">ホーム画面に追加して<br/>より快適にアクセス</div>
          </div>

          <button
            onClick={handleClick}
            className="bg-orange-500 text-white text-xs font-bold px-5 py-2.5 rounded-full hover:bg-orange-600 transition-colors shrink-0 shadow-lg shadow-orange-500/20"
          >
            入手
          </button>
        </div>
      </div>

      {/* iOS用インストールガイドモーダル */}
      {showIOSGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-6 animate-in fade-in duration-200">
          <div 
            className="bg-white w-full max-w-sm rounded-3xl p-8 shadow-2xl animate-in zoom-in-95 duration-300 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              onClick={() => setShowIOSGuide(false)}
              className="absolute top-4 right-4 p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>

            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-white border border-gray-100 shadow-sm rounded-2xl mx-auto mb-4 flex items-center justify-center p-2">
                <img src="/logo.png" alt="OKIPOKA" className="w-full h-full object-contain" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">ホーム画面に追加</h3>
              <p className="text-sm text-slate-500 mt-2 leading-relaxed">
                アプリとしてインストールすると、<br/>
                全画面で快適に利用できます。
              </p>

              <div className="mt-4 bg-red-50 text-red-600 text-xs font-bold p-3 rounded-xl border border-red-100 flex items-start gap-2 text-left">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>Safari または Chrome で開いてください。</span>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 flex items-center justify-center bg-slate-50 rounded-full text-blue-500 shrink-0">
                  <Share className="w-6 h-6" />
                </div>
                <div className="text-sm text-slate-600 leading-tight">
                  <div className="text-xs text-slate-400 mb-0.5">STEP 1</div>
                  画面下部の<span className="font-bold text-slate-900">共有ボタン</span>をタップ
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 flex items-center justify-center bg-slate-50 rounded-full text-slate-700 shrink-0">
                  <PlusSquare className="w-6 h-6" />
                </div>
                <div className="text-sm text-slate-600 leading-tight">
                  <div className="text-xs text-slate-400 mb-0.5">STEP 2</div>
                  メニューから<span className="font-bold text-slate-900">ホーム画面に追加</span>を選択
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-12 h-12 flex items-center justify-center bg-slate-50 rounded-full text-slate-700 shrink-0">
                  <span className="font-bold text-xs">追加</span>
                </div>
                <div className="text-sm text-slate-600 leading-tight">
                  <div className="text-xs text-slate-400 mb-0.5">STEP 3</div>
                  右上の<span className="font-bold text-slate-900">追加</span>をタップして完了
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowIOSGuide(false)}
              className="w-full mt-8 bg-slate-900 text-white font-bold py-3.5 rounded-xl hover:bg-slate-800 transition-colors shadow-lg shadow-slate-200"
            >
              閉じる
            </button>
          </div>
        </div>
      )}
    </>
  );
}
