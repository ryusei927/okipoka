import Image from "next/image";
import Link from "next/link";
import { Ad } from "./AdBanner";

export function AdSquareGrid({ ads }: { ads: Ad[] }) {
  if (!ads || ads.length === 0) return null;

  return (
    <div className="w-full max-w-md md:max-w-4xl mx-auto px-4 py-6">
      <div className="text-[10px] text-gray-400 mb-1">広告</div>
      <div className="grid grid-cols-2 gap-4">
        {ads.map((ad) => (
          <div key={ad.id} className="relative w-full aspect-square overflow-hidden rounded-lg shadow-sm border border-gray-100 bg-gray-50">
            {ad.link_url ? (
              <Link href={ad.link_url} target="_blank" rel="noopener noreferrer" className="block w-full h-full">
                <Image
                  src={ad.image_url}
                  alt={ad.title}
                  fill
                  className="object-contain hover:scale-105 transition-transform duration-300"
                />
              </Link>
            ) : (
              <Image
                src={ad.image_url}
                alt={ad.title}
                fill
                className="object-contain"
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
