import Image from "next/image";
import { AdClickWrapper } from "./AdClickWrapper";

export type Ad = {
  id: string;
  title: string;
  image_url: string;
  link_url: string | null;
  type: 'banner' | 'square' | 'story' | 'card';
  priority: number;
  is_active: boolean;
  description?: string | null;
  start_at?: string | null;
  end_at?: string | null;
};

export function AdBanner({ ad }: { ad: Ad }) {
  if (!ad) return null;

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-2">
      <div className="text-[10px] text-gray-400 mb-1">広告</div>
      <AdClickWrapper ad={ad} className="block w-full overflow-hidden shadow-sm hover:shadow-md transition-shadow">
        <Image
          src={ad.image_url}
          alt={ad.title}
          width={0}
          height={0}
          sizes="100vw"
          className="w-full h-auto"
        />
      </AdClickWrapper>
    </div>
  );
}
