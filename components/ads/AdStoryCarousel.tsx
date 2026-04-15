"use client";

import Image from "next/image";
import { Ad } from "./AdBanner";
import { AdClickWrapper } from "./AdClickWrapper";

export function AdStoryCarousel({ ads }: { ads: Ad[] }) {
  if (!ads || ads.length === 0) return null;

  return (
    <div className="w-full max-w-md md:max-w-4xl mx-auto px-4 py-4">
      <div className="text-[10px] text-gray-400 mb-2">広告</div>
      <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 -mx-1 px-1 snap-x snap-mandatory">
        {ads.map((ad) => (
          <AdClickWrapper
            key={ad.id}
            ad={ad}
            className="shrink-0 w-28 snap-start group"
          >
            <div className="relative w-28 h-28 overflow-hidden border-2 border-orange-200 shadow-sm group-hover:border-orange-400 transition-colors">
              <Image
                src={ad.image_url}
                alt={ad.title}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </div>
            <p className="mt-1.5 text-[11px] font-bold text-gray-700 text-center leading-tight line-clamp-2">
              {ad.title}
            </p>
            {ad.description && (
              <p className="text-[10px] text-gray-400 text-center leading-tight line-clamp-1 mt-0.5">
                {ad.description}
              </p>
            )}
          </AdClickWrapper>
        ))}
      </div>
    </div>
  );
}
