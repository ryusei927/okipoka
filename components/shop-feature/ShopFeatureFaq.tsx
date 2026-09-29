"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

type FaqItem = { q: string; a: string };

export function ShopFeatureFaq({ items }: { items: FaqItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="divide-y divide-white/10 border border-white/10">
      {items.map((item, i) => {
        const isOpen = openIndex === i;
        return (
          <div key={i}>
            <button
              onClick={() => setOpenIndex(isOpen ? null : i)}
              className="w-full flex items-start gap-4 px-5 py-4 text-left hover:bg-white/5 transition-colors"
              aria-expanded={isOpen}
            >
              <span className="shrink-0 mt-0.5 text-sm font-black text-orange-400">Q.</span>
              <span className="flex-1 text-sm font-bold text-white">{item.q}</span>
              <ChevronDown
                className={`w-4 h-4 text-gray-500 shrink-0 mt-0.5 transition-transform duration-200 ${
                  isOpen ? "rotate-180" : ""
                }`}
              />
            </button>
            <div
              className={`grid transition-[grid-template-rows] duration-200 ${
                isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
              }`}
            >
              <div className="overflow-hidden">
                <div className="px-5 pb-4 pl-12">
                  <p className="text-sm text-gray-400 leading-relaxed">{item.a}</p>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
