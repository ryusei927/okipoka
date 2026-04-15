import Image from "next/image";
import { Ad } from "./AdBanner";
import { AdClickWrapper } from "./AdClickWrapper";

export function AdSquareGrid({ ads }: { ads: Ad[] }) {
  if (!ads || ads.length === 0) return null;

  return (
    <div className="w-full max-w-md md:max-w-4xl mx-auto px-4 py-6">
      <div className="text-[10px] text-gray-400 mb-1">広告</div>
      <div className="grid grid-cols-2 gap-3">
        {ads.map((ad) => (
          <AdClickWrapper key={ad.id} ad={ad} className="block group">
            <div className="relative w-full aspect-square overflow-hidden shadow-sm border border-gray-100 bg-gray-50">
              <Image
                src={ad.image_url}
                alt={ad.title}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
              />
              {/* 下部グラデーション + テキスト */}
              <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/60 via-black/20 to-transparent pt-8 pb-2 px-2">
                <p className="text-xs font-bold text-white leading-tight line-clamp-2">{ad.title}</p>
                {ad.description && (
                  <p className="text-[10px] text-white/70 leading-tight line-clamp-1 mt-0.5">{ad.description}</p>
                )}
              </div>
            </div>
          </AdClickWrapper>
        ))}
      </div>
    </div>
  );
}
