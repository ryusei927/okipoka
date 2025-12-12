"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight, ChevronDown, X, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

type FeaturedItem = {
  id: string;
  image_url: string;
  link_url: string | null;
  alt_text: string | null;
};

type SlideItem = {
  id: string;
  type: "static" | "pr";
  image_url: string;
  link_url: string | null;
  alt_text: string | null;
};

export function HeroSlider({ featuredItems }: { featuredItems: FeaturedItem[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [selectedSlide, setSelectedSlide] = useState<SlideItem | null>(null);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  // スライドデータの構築
  const slides: SlideItem[] = [
    {
      id: "top-hero",
      type: "static",
      image_url: "/top.png",
      link_url: null,
      alt_text: "OKIPOKA - 沖縄のポーカー情報を全てここに",
    },
    ...featuredItems.map((item) => ({
      ...item,
      type: "pr" as const,
    })),
  ];

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % slides.length);
  }, [slides.length]);

  const prevSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length);
  }, [slides.length]);

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setIsPaused(true);
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    setIsPaused(false);
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    if (isLeftSwipe) {
      nextSlide();
    }
    if (isRightSwipe) {
      prevSlide();
    }
  };

  // 自動再生
  useEffect(() => {
    if (isPaused || slides.length <= 1) return;
    
    const timer = setInterval(() => {
      nextSlide();
    }, 4000); // 4秒ごとにスライド

    return () => clearInterval(timer);
  }, [isPaused, nextSlide, slides.length]);

  return (
    <div 
      className="relative w-full bg-black group"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* メインスライダーエリア */}
      {/* スマホ: 16:9〜4:5程度、PC: 21:9〜16:9程度。コンテンツに合わせて調整 */}
      <div className="relative w-full aspect-video md:aspect-[21/9] max-h-[85vh] overflow-hidden">
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            className={cn(
              "absolute inset-0 w-full h-full transition-opacity duration-700 ease-in-out",
              index === currentIndex ? "opacity-100 z-10" : "opacity-0 z-0"
            )}
          >
            {/* スライドコンテンツ */}
            <SlideContent 
              slide={slide} 
              isActive={index === currentIndex} 
              onExpand={setSelectedSlide}
            />
          </div>
        ))}

        {/* グラデーションオーバーレイ（下部） */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/80 to-transparent z-20 pointer-events-none" />
      </div>

      {/* ナビゲーションボタン (PCのみ表示、ホバーで出現) */}
      {slides.length > 1 && (
        <>
          <button
            onClick={prevSlide}
            className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 z-30 w-8 h-8 md:w-12 md:h-12 flex items-center justify-center rounded-full bg-black/30 text-white backdrop-blur-sm hover:bg-black/50 transition-all opacity-100 md:opacity-0 md:group-hover:opacity-100"
            aria-label="Previous slide"
          >
            <ChevronLeft className="w-4 h-4 md:w-6 md:h-6" />
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 z-30 w-8 h-8 md:w-12 md:h-12 flex items-center justify-center rounded-full bg-black/30 text-white backdrop-blur-sm hover:bg-black/50 transition-all opacity-100 md:opacity-0 md:group-hover:opacity-100"
            aria-label="Next slide"
          >
            <ChevronRight className="w-4 h-4 md:w-6 md:h-6" />
          </button>
        </>
      )}

      {/* インジケーター (ドット) */}
      {slides.length > 1 && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 flex gap-2">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={cn(
                "w-2 h-2 rounded-full transition-all duration-300",
                index === currentIndex 
                  ? "bg-orange-500 scale-125" 
                  : "bg-white/50 hover:bg-white/80"
              )}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}

      {/* スクロール誘導 (トップ画像のときのみ表示) - 削除済み */}

      {/* PR拡大モーダル */}
      {selectedSlide && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 p-4 animate-in fade-in duration-200"
          onClick={() => setSelectedSlide(null)}
        >
          <button 
            onClick={() => setSelectedSlide(null)}
            className="absolute top-4 right-4 text-white/70 hover:text-white p-2 z-10"
          >
            <X className="w-8 h-8" />
          </button>

          <div 
            className="relative w-full max-w-4xl max-h-[90vh] flex flex-col items-center gap-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative w-full aspect-square md:aspect-video flex-1 min-h-0">
              <Image
                src={selectedSlide.image_url}
                alt={selectedSlide.alt_text || ""}
                fill
                className="object-contain"
              />
            </div>
            
            <div className="flex flex-col items-center gap-4">
              {selectedSlide.alt_text && (
                <h3 className="text-white text-xl md:text-2xl font-bold text-center whitespace-pre-wrap">
                  {selectedSlide.alt_text}
                </h3>
              )}

              {selectedSlide.link_url && (
                <a
                  href={selectedSlide.link_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 bg-orange-500 text-white px-8 py-3 rounded-full font-bold hover:bg-orange-600 transition-colors"
                >
                  詳しく見る
                  <ExternalLink className="w-5 h-5" />
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SlideContent({ 
  slide, 
  isActive,
  onExpand
}: { 
  slide: SlideItem; 
  isActive: boolean;
  onExpand: (slide: SlideItem) => void;
}) {
  // コンテンツの中身
  const Inner = () => (
    <div className="relative w-full h-full flex items-center justify-center bg-neutral-900">
      {/* 背景（ぼかし）: PR画像のときのみ、またはトップ画像でも雰囲気出しに使う */}
      <div className="absolute inset-0 overflow-hidden">
        <Image
          src={slide.image_url}
          alt=""
          fill
          className={cn(
            "object-cover transition-transform duration-[10000ms] ease-linear",
            isActive ? "scale-110" : "scale-100",
            slide.type === "pr" ? "blur-xl opacity-40" : "blur-sm opacity-30"
          )}
          priority={slide.type === "static"} // トップ画像は優先読み込み
        />
      </div>

      {/* メイン画像 */}
      <div className="relative w-full h-full max-w-[1920px] mx-auto">
        <Image
          src={slide.image_url}
          alt={slide.alt_text || ""}
          fill
          className={cn(
            "object-contain drop-shadow-2xl",
            slide.type === "static" ? "object-cover" : "p-4 md:p-8" // トップ画像はカバー、PRは全体表示
          )}
          priority={slide.type === "static"}
        />
      </div>

      {/* テキストオーバーレイ (PR画像の場合) */}
      {slide.type === "pr" && slide.alt_text && (
        <div className="absolute bottom-16 left-0 right-0 text-center px-4 z-20 pointer-events-none">
          <span className="text-white/90 text-xs md:text-base font-medium drop-shadow-md inline-block bg-black/30 backdrop-blur-[2px] px-4 py-1.5 rounded-xl border border-white/10 whitespace-pre-wrap">
            {slide.alt_text}
          </span>
        </div>
      )}
    </div>
  );

  if (slide.type === "pr") {
    return (
      <div 
        onClick={() => onExpand(slide)}
        className="block w-full h-full cursor-pointer"
      >
        <Inner />
      </div>
    );
  }

  if (slide.link_url) {
    return (
      <a
        href={slide.link_url}
        target="_blank"
        rel="noopener noreferrer"
        className="block w-full h-full cursor-pointer"
      >
        <Inner />
      </a>
    );
  }

  return <Inner />;
}
