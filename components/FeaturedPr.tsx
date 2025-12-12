import Image from "next/image";
import { cn } from "@/lib/utils";

type FeaturedItem = {
  id: string;
  image_url: string;
  link_url: string | null;
  alt_text: string | null;
};

export function FeaturedPr({ items }: { items: FeaturedItem[] }) {
  if (!items || items.length === 0) return null;

  return (
    <div className="w-full py-4">
      <div className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-4 -mx-4 px-4 scrollbar-hide md:grid md:grid-cols-2 lg:grid-cols-3 md:overflow-visible md:pb-0 md:mx-0 md:px-0">
        {items.map((item) => (
          <div key={item.id} className="snap-center shrink-0 w-[85vw] md:w-auto">
            <FeaturedItemContent item={item} />
          </div>
        ))}
      </div>
    </div>
  );
}

function FeaturedItemContent({ item }: { item: FeaturedItem }) {
  const Content = () => (
    <div className="group relative w-full aspect-4/5 md:aspect-3/4 rounded-2xl overflow-hidden shadow-md border border-border/50 bg-muted transition-all hover:shadow-xl">
      {/* 背景用（ぼかし） */}
      <div className="absolute inset-0">
        <Image
          src={item.image_url}
          alt=""
          fill
          className="object-cover blur-2xl opacity-50 scale-110 dark:opacity-30"
        />
      </div>
      
      {/* メイン画像 */}
      <div className="relative h-full w-full p-4 transition-transform duration-500 group-hover:scale-[1.02]">
        <Image
          src={item.image_url}
          alt={item.alt_text || "Featured PR"}
          fill
          className="object-contain drop-shadow-lg"
          priority
        />
      </div>

      {/* テキストオーバーレイ */}
      {item.alt_text && (
        <div className="absolute bottom-0 left-0 right-0 bg-linear-to-t from-black/90 via-black/50 to-transparent p-6 pt-12 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <p className="text-white font-medium text-sm md:text-base line-clamp-2">
            {item.alt_text}
          </p>
        </div>
      )}
    </div>
  );

  if (item.link_url) {
    return (
      <a 
        href={item.link_url} 
        target="_blank" 
        rel="noopener noreferrer" 
        className="block h-full"
      >
        <Content />
      </a>
    );
  }

  return <Content />;
}
