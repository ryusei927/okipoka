"use client";

import dynamic from "next/dynamic";

const HeroSlider = dynamic(
  () => import("./HeroSlider").then((mod) => mod.HeroSlider),
  { ssr: false }
);

export function HeroSliderWrapper(props: any) {
  return <HeroSlider {...props} />;
}
