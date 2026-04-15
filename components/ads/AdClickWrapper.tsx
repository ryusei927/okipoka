"use client";

import { Ad } from "./AdBanner";

interface Props {
  ad: Ad;
  children: React.ReactNode;
  className?: string;
}

export function AdClickWrapper({ ad, children, className }: Props) {
  const handleClick = () => {
    // 非同期でクリック計測（ユーザー体験を阻害しない）
    if (ad.id) {
      navigator.sendBeacon(`/api/ads/click`, JSON.stringify({ adId: ad.id }));
    }
  };

  if (!ad.link_url) {
    return <div className={className}>{children}</div>;
  }

  return (
    <a
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
