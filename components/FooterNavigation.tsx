"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Calendar, User, Layers } from "lucide-react";
import { cn } from "@/lib/utils";

export function FooterNavigation() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 pb-safe z-50">
      <div className="max-w-md md:max-w-4xl mx-auto flex justify-around py-3">
        <Link 
          href="/" 
          className={cn(
            "flex flex-col items-center gap-1 transition-colors",
            pathname === "/" ? "text-orange-500" : "text-gray-400 hover:text-orange-500"
          )}
        >
          <Calendar className="w-6 h-6" />
          <span className="text-[10px] font-bold">大会</span>
        </Link>
        <Link 
          href="/hands" 
          className={cn(
            "flex flex-col items-center gap-1 transition-colors",
            pathname.startsWith("/hands") ? "text-orange-500" : "text-gray-400 hover:text-orange-500"
          )}
        >
          <Layers className="w-6 h-6" />
          <span className="text-[10px] font-bold">ハンド</span>
        </Link>
        <Link 
          href="/member" 
          className={cn(
            "flex flex-col items-center gap-1 transition-colors",
            pathname.startsWith("/member") ? "text-orange-500" : "text-gray-400 hover:text-orange-500"
          )}
        >
          <User className="w-6 h-6" />
          <span className="text-[10px] font-bold">マイページ</span>
        </Link>
      </div>
    </nav>
  );
}
