"use client";

import { useEffect, useRef } from "react";
import { Ad } from "./AdBanner";

interface Props {
  ad: Ad;
  children: React.ReactNode;
  className?: string;
}

export function AdClickWrapper({ ad, children, className }: Props) {
  const rootRef = useRef<HTMLElement | null>(null);
  const trackedRef = useRef(false);

  // 表示計測：広告が実際に画面に入ったら1回だけカウント（単なるページ読込ではなく「見えた」回数）
  useEffect(() => {
    const el = rootRef.current;
    if (!el || !ad.id) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && !trackedRef.current) {
            trackedRef.current = true;
            navigator.sendBeacon(
              `/api/ads/impression`,
              JSON.stringify({ adId: ad.id })
            );
            observer.disconnect();
          }
        }
      },
      { threshold: 0.5 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [ad.id]);

  const handleClick = () => {
    // 非同期でクリック計測（ユーザー体験を阻害しない）
    if (ad.id) {
      navigator.sendBeacon(`/api/ads/click`, JSON.stringify({ adId: ad.id }));
    }
  };

  if (!ad.link_url) {
    return (
      <div
        ref={rootRef as React.RefObject<HTMLDivElement>}
        className={className}
      >
        {children}
      </div>
    );
  }

  return (
    <a
      ref={rootRef as React.RefObject<HTMLAnchorElement>}
      href={ad.link_url}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      onClick={handleClick}
    >
      {children}
    </a>
  );
}
