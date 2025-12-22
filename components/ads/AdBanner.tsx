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

  const Content = () => (
    <div className="relative w-full aspect-[3/1] md:aspect-[4/1] overflow-hidden rounded-lg shadow-sm border border-gray-100 bg-gray-50">
      <Image
        src={ad.image_url}
        alt={ad.title}
        fill
        className="object-contain"
      />
    </div>
  );

  return (
        <div className="w-full max-w-4xl mx-auto px-4 py-2">
      <a
        href={ad.link_url || "#"}
        target="_blank"
        rel="noopener noreferrer"
        className="block relative w-full aspect-3/1 md:aspect-4/1 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
        onClick={handleClick}
      >
  );
}
