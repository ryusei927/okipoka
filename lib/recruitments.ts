export type RecruitRole = {
  title: string;
  payLabel: string;
  payNote?: string;
  perks: string[];
};

export type RecruitPhoto = {
  src: string;
  alt: string;
};

export type Recruitment = {
  slug: string;
  shopName: string;
  shopSlug?: string;
  area: string;
  address: string;
  openingHours?: string;
  headline: string;
  intro: string;
  roles: RecruitRole[];
  commonPerks: string[];
  applyNote: string;
  bannerUrl?: string;
  photos?: RecruitPhoto[];
};

export const recruitments: Recruitment[] = [
  {
    slug: "chill-tilt",
    shopName: "Chill&Tilt",
    shopSlug: "tilt",
    area: "中部",
    address: "沖縄県沖縄市美里1-27-2 B1",
    openingHours: "21:00〜",
    headline: "Chill&Tiltで一緒に働きませんか",
    intro:
      "沖縄市美里のポーカールーム Chill&Tilt のスタッフ・店長を募集しています。昇給あり。チップバック・ドリンクバックあり。",
    roles: [
      {
        title: "スタッフ",
        payLabel: "時給 1,500円〜",
        payNote: "研修期間中は 1,200円〜",
        perks: ["昇給あり", "チップバック", "ドリンクバック 50%"],
      },
      {
        title: "店長",
        payLabel: "月給 200,000円〜",
        perks: ["昇給あり", "チップバック", "ドリンクバック 50%"],
      },
    ],
    commonPerks: ["昇給あり", "チップバック", "ドリンクバック 50%"],
    applyNote: "ご応募・詳しい条件は店舗までお問い合わせください。",
    photos: [
      {
        src: "/recruit/chill-tilt/interior-2.jpg",
        alt: "Chill&Tilt ポーカーテーブル",
      },
      {
        src: "/recruit/chill-tilt/interior-1.jpg",
        alt: "Chill&Tilt カウンター",
      },
      {
        src: "/recruit/chill-tilt/entrance.jpg",
        alt: "Chill&Tilt 入口",
      },
    ],
  },
];

export function getRecruitmentBySlug(slug: string) {
  return recruitments.find((r) => r.slug === slug);
}

export function getRecruitmentByShopSlug(shopSlug: string | null | undefined) {
  if (!shopSlug) return undefined;
  return recruitments.find((r) => r.shopSlug === shopSlug);
}

export function getRecruitmentByShopName(name: string | null | undefined) {
  if (!name) return undefined;
  return recruitments.find(
    (r) => r.shopName.toLowerCase() === name.toLowerCase()
  );
}
