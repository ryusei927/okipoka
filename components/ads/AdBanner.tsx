import Image from "next/image";
import Link from "next/link";

export type Ad = {
  id: string;
  title: string;
  image_url: string;
  link_url: string | null;
  type: 'banner' | 'square';
  priority: number;
  is_active: boolean;
};

export function AdBanner({ ad }: { ad: Ad }) {
  if (!ad) return null;

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-2">
      <div className="text-[10px] text-gray-400 mb-1">広告</div>
      <a
        href={ad.link_url || "#"}
        target="_blank"
        rel="noopener noreferrer"
        className="block w-full rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
      >
        <Image
          src={ad.image_url}
          alt={ad.title}
          width={0}
          height={0}
          sizes="100vw"
          className="w-full h-auto"
        />
      </a>
    </div>
  );
}
