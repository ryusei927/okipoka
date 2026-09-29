/**
 * 店舗特設ページのデータ定義
 *
 * 新しい店舗を追加するには、`featuredShops` 配列にエントリを追加し、
 * 画像を `public/shops/<slug>/` に配置するだけでOK。
 * ページは `/shops/<slug>` で自動的に生成される。
 */

export type ShopFeatureImage = {
  src: string;
  alt: string;
};

export type ShopFeatureAppeal = {
  icon: "users" | "sparkles" | "dices" | "message";
  image: ShopFeatureImage;
  title: string;
  description: string;
};

export type ShopFeatureFaq = {
  q: string;
  a: string;
};

export type ShopFeature = {
  slug: string;

  /** DB 検索用: shops.slug or shops.name に部分一致させる候補 */
  dbSlugs: string[];
  dbNamePattern: string;

  /** メタデータ */
  meta: {
    title: string;
    description: string;
    ogImage?: string;
  };

  /** ① メインビジュアル */
  hero: {
    image: string;
    tagline: string;
    catchcopy: string;
    shopName: string;
    shopNameEn: string;
    description: string;
    badges: string[];
  };

  /** ② 動画セクション */
  video?: {
    heading: string;
    description: string;
    /** mp4 パスまたは YouTube embed URL */
    src: string;
    /** "file" = <video>, "youtube" = <iframe> */
    type: "file" | "youtube";
  };

  /** ③ 魅力セクション */
  appeals: {
    heading: string;
    items: ShopFeatureAppeal[];
  };

  /** ④ 初めての方へ */
  beginners: {
    heading: string;
    paragraphs: string[];
    note?: string;
    ctaLabel?: string;
    ctaUrl?: string;
  };

  /** ⑤ フォトギャラリー */
  gallery: ShopFeatureImage[];

  /** ⑥ イベント — 自動取得（slug で DB 検索） */

  /** ⑦ 料金案内 */
  pricing?: {
    heading: string;
    description: string;
    ctaLabel: string;
    ctaUrl: string;
  };

  /** ⑧ FAQ */
  faq: ShopFeatureFaq[];

  /** ⑨ 店舗情報 */
  info: {
    name: string;
    nameEn: string;
    zip: string;
    address: string;
    access: string;
    hours: string;
    phone: string;
    instagram?: string;
    instagramHandle?: string;
    website?: string;
    googleMapQuery?: string;
  };

  /** ⑩ 最後のメッセージ */
  closing: {
    heading: string;
    description: string;
  };

  /** 注釈 */
  infoNote?: string;
};

// ─────────────────────────────────────────────
// データ
// ─────────────────────────────────────────────

export const featuredShops: ShopFeature[] = [
  {
    slug: "rebarta",
    dbSlugs: ["rebarta-plus", "rebarta_plus", "rebarta", "riverta", "rebarta-plus-naha"],
    dbNamePattern: "%リバータ%",

    meta: {
      title: "リバータ・プラス｜ReBarta Plus - 久茂地のポーカー＆エンタメBAR",
      description:
        "那覇・久茂地のアミューズメントポーカー＆エンタメBAR「リバータ・プラス」特設ページ。初心者歓迎、ポーカー・ダーツ・カラオケが楽しめる。美栄橋駅徒歩5分。",
      ogImage: "/shops/rebarta/interior.webp",
    },

    hero: {
      image: "/shops/rebarta/interior.webp",
      tagline: "OKIPOKA FEATURED",
      catchcopy: "人が集まる。会話が弾む。\n今夜がもっと楽しくなる。",
      shopName: "リバータ・プラス",
      shopNameEn: "ReBarta Plus",
      description:
        "一人でふらっと。友人と一緒に。\n久茂地で、ポーカーをきっかけに楽しい時間を。",
      badges: ["初心者歓迎", "一人でもグループでも", "沖縄旅行の夜にも"],
    },

    video: {
      heading: "まずは、店内の雰囲気をのぞいてみよう。",
      description: "写真だけでは伝わりきらない店内の空気を、動画でご紹介します。",
      src: "/shops/rebarta/intro.mp4",
      type: "file",
    },

    appeals: {
      heading: "遊びも、会話も、楽しめる場所。",
      items: [
        {
          icon: "users",
          image: { src: "/shops/rebarta/player.webp", alt: "プレイヤー同士の交流" },
          title: "一人で来ても、楽しみが広がる。",
          description:
            "同じテーブルを囲んでいるうちに、自然と会話が生まれる。\n初めて会う人との交流も、ここで過ごす楽しみのひとつです。",
        },
        {
          icon: "sparkles",
          image: { src: "/shops/rebarta/table.webp", alt: "ポーカーテーブル" },
          title: "初めてのポーカーも、気軽に。",
          description:
            "ルールを知らない方も歓迎。\nまずは遊び方を教わりながら、ポーカーの楽しさに触れてみませんか。",
        },
        {
          icon: "dices",
          image: { src: "/shops/rebarta/bar.webp", alt: "バーカウンター" },
          title: "ポーカーだけじゃない、遊びの選択肢。",
          description:
            "店内にはポーカーテーブルを5卓設置。\nダーツやカラオケも楽しめるので、友人とのお出かけにも、旅行中の夜の寄り道にもぴったりです。",
        },
      ],
    },

    beginners: {
      heading: "ポーカーが初めてでも、大丈夫。",
      paragraphs: [
        "「興味はあるけど、ルールがわからない」\n「一人で行っても楽しめるかな？」",
        "そんな方も気軽に楽しめるよう、初心者向けの無料講習を実施。\nカードの見方やゲームの進め方を、スタッフが丁寧にご案内します。",
        "お一人での来店はもちろん、友人同士や沖縄を訪れた観光客の方も歓迎です。",
      ],
      note: "※無料講習とゲームの利用料金は別の案内となります。講習のご案内状況は店舗へお問い合わせください。",
      ctaLabel: "Instagramで相談する",
      ctaUrl: "https://www.instagram.com/rebarta_plus/",
    },

    gallery: [
      { src: "/shops/rebarta/interior.webp", alt: "店内の賑わい" },
      { src: "/shops/rebarta/bar.webp", alt: "バーカウンター" },
      { src: "/shops/rebarta/player.webp", alt: "プレイヤーの笑顔" },
      { src: "/shops/rebarta/table.webp", alt: "ポーカーテーブル" },
    ],

    pricing: {
      heading: "料金を確認して、気軽に遊びに。",
      description:
        "遊び方に合わせた料金は、公式サイトでご確認いただけます。\n初めてで迷ったときは、店舗へお気軽にお問い合わせください。",
      ctaLabel: "公式サイトで料金を見る",
      ctaUrl: "https://nahapoker.com/",
    },

    faq: [
      {
        q: "一人でも、初めてでも行けますか？",
        a: "お一人でのご来店も、ポーカーが初めての方も歓迎です。不安なことはスタッフへお気軽にご相談ください。",
      },
      {
        q: "予約は必要ですか？",
        a: "ご案内状況は日によって異なります。ご来店前に公式Instagramまたはお電話でご確認ください。",
      },
      {
        q: "ポーカー以外も楽しめますか？",
        a: "ダーツやカラオケも楽しめます。利用方法や料金は店舗へお問い合わせください。",
      },
    ],

    info: {
      name: "リバータ・プラス",
      nameEn: "ReBarta Plus",
      zip: "〒900-0015",
      address: "沖縄県那覇市久茂地2丁目16−24 New 久茂地 B.L.D.G 3F",
      access: "美栄橋駅から徒歩5分",
      hours: "19:00〜LAST",
      phone: "098-862-0921",
      instagram: "https://www.instagram.com/rebarta_plus/",
      instagramHandle: "@rebarta_plus",
      website: "https://nahapoker.com/",
      googleMapQuery: "沖縄県那覇市久茂地2丁目16−24 New 久茂地 B.L.D.G",
    },

    closing: {
      heading: "今夜の予定に、\nリバータ・プラスを。",
      description:
        "初めての方も、いつもの仲間とも。\n遊びと会話を楽しむ時間を、ここで。",
    },

    infoNote: "※店舗情報は2026年9月24日の公式サイト確認時点の内容です。最新情報は店舗へ直接ご確認ください。",
  },
];

// ─────────────────────────────────────────────
// ヘルパー
// ─────────────────────────────────────────────

export function getFeaturedShop(slug: string): ShopFeature | undefined {
  return featuredShops.find((s) => s.slug === slug);
}

export function getAllFeaturedSlugs(): string[] {
  return featuredShops.map((s) => s.slug);
}

/**
 * DB の shop.slug や shop.name から特設ページの slug を逆引きする。
 * ShopAccordion などで「特設ページがあるか」を判定するのに使う。
 */
export function getFeaturedSlugByShop(shop: {
  slug?: string | null;
  name?: string | null;
}): string | null {
  for (const f of featuredShops) {
    if (shop.slug && f.dbSlugs.includes(shop.slug)) return f.slug;
    if (shop.name) {
      const pattern = f.dbNamePattern.replace(/%/g, "");
      if (shop.name.includes(pattern)) return f.slug;
    }
  }
  return null;
}
