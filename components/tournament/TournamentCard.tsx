import { ArrowRight, MapPin, Coins, Store } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { TournamentStatus } from "./TournamentStatus";

interface TournamentCardProps {
  id: string;
  title: string;
  startAt: string;
  lateRegAt?: string | null;
  shopName: string;
  shopImageUrl?: string | null;
  buyIn: string;
  tags?: string[];
  isPremium?: boolean; // 店舗ランクによる差別化用
}

export function TournamentCard({
  id,
  title,
  startAt,
  lateRegAt,
  shopName,
  shopImageUrl,
  buyIn,
  tags = ["トーナメント"],
  isPremium = false,
}: TournamentCardProps) {
  return (
    <Link href={`/tournaments/${id}`} className="block group">
      <div
        className={cn(
          "relative bg-white rounded-xl border border-gray-200 shadow-sm p-4 transition-all duration-200 hover:shadow-md hover:border-orange-200"
        )}
      >
        <div className="flex flex-col md:flex-row items-center gap-2 md:gap-4">
          {/* 時間表示 */}
          <div className="flex flex-col items-center justify-center min-w-20 pb-2 md:pb-0 border-b md:border-b-0 border-gray-100 w-full md:w-auto">
            <TournamentStatus startAt={startAt} lateRegAt={lateRegAt} className="text-2xl" />
          </div>

          {/* コンテンツコンテナ */}
          <div className="flex-1 min-w-0 flex flex-col md:flex-row md:items-center gap-2 md:gap-4 w-full">
            
            {/* タイトルと店舗情報 */}
            <div className="flex-1 min-w-0 flex flex-col items-center md:items-start text-center md:text-left">
              <h3 className="text-base md:text-lg font-bold text-gray-900 w-full truncate group-hover:text-orange-600 transition-colors">
                {title}
              </h3>
              
              <div className="flex items-center gap-2 mt-1 text-sm text-gray-600 justify-center md:justify-start">
                <div className="relative w-5 h-5 rounded-full overflow-hidden bg-gray-100 shrink-0">
                  {shopImageUrl ? (
                    <Image
                      src={shopImageUrl}
                      alt={shopName}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <Store className="w-3 h-3 text-gray-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                  )}
                </div>
                <span className="font-medium truncate">{shopName}</span>
              </div>
            </div>

            {/* Buy-inとタグ (PCでは右寄せ) */}
            <div className="flex flex-col items-center md:items-end gap-1 mt-1 md:mt-0 w-full md:w-auto bg-gray-50 md:bg-transparent p-2 md:p-0 rounded-lg md:rounded-none">
              <div className="text-sm text-gray-600 whitespace-nowrap">
                <span className="font-bold text-gray-500 mr-1">Buy-in:</span>
                <span className="font-medium text-gray-900">{buyIn}</span>
              </div>
              
              <div className="flex gap-1">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-0.5 text-xs font-medium text-gray-500 bg-gray-100 md:bg-gray-100 rounded-md border border-gray-200 md:border-transparent"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

          </div>

          {/* 矢印 (PCのみ表示) */}
          <div className="hidden md:flex items-center justify-center w-8 h-8 text-gray-300 group-hover:text-orange-500 group-hover:translate-x-1 transition-all shrink-0">
            <ArrowRight className="w-6 h-6" />
          </div>
        </div>
      </div>
    </Link>
  );
}
