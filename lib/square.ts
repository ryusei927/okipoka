import { randomUUID } from "crypto";
import { SquareClient, SquareEnvironment, type Square } from "square";

const isProduction = process.env.SQUARE_ENVIRONMENT === "production";

/**
 * Square 公式 SDK のクライアント。
 * - 認証トークン・環境（本番/サンドボックス）を環境変数から設定
 * - maxRetries はデフォルト2（429/5xx 時に自動リトライ）
 */
export const squareClient = new SquareClient({
  token: process.env.SQUARE_ACCESS_TOKEN,
  environment: isProduction
    ? SquareEnvironment.Production
    : SquareEnvironment.Sandbox,
});

const PREMIUM_PLAN_NAME = "OKIPOKA プレミアム会員";

export type CardOnFile = {
  brand: string;
  last4: string;
  expMonth: number | null;
  expYear: number | null;
};

/**
 * 会員が登録しているカード（ブランド・下4桁・有効期限）を取得する。
 * - まずサブスクに紐づくカードIDを使い、無ければ顧客のカード一覧から取得
 * - Square 側で取得に失敗しても表示を壊さないよう、失敗時は null を返す
 */
export async function getCardOnFile(params: {
  subscriptionId?: string | null;
  customerId?: string | null;
}): Promise<CardOnFile | null> {
  try {
    let cardId: string | undefined;

    if (params.subscriptionId) {
      try {
        const { subscription } = await squareClient.subscriptions.get({
          subscriptionId: params.subscriptionId,
        });
        cardId = subscription?.cardId ?? undefined;
      } catch {
        // サブスク取得に失敗しても顧客のカード一覧で再挑戦する
      }
    }

    let card: Square.Card | undefined;

    if (cardId) {
      const res = await squareClient.cards.get({ cardId });
      card = res.card;
    } else if (params.customerId) {
      // フォールバック: 顧客に紐づく有効なカードから1枚取得
      const res = await squareClient.cards.list({ customerId: params.customerId });
      for await (const c of res) {
        if (c.enabled !== false) {
          card = c;
          break;
        }
      }
    }

    if (!card || !card.last4) return null;

    return {
      brand: card.cardBrand ?? "OTHER_BRAND",
      last4: card.last4,
      expMonth: card.expMonth != null ? Number(card.expMonth) : null,
      expYear: card.expYear != null ? Number(card.expYear) : null,
    };
  } catch {
    return null;
  }
}

export async function getOrCreateSubscriptionPlan(): Promise<string | undefined> {
  // 環境変数にあればそれを使う
  const envPlanId = process.env.SQUARE_SUBSCRIPTION_PLAN_ID;
  if (envPlanId) {
    try {
      const { object } = await squareClient.catalog.object.get({
        objectId: envPlanId,
        includeRelatedObjects: false,
      });
      if (object && object.type === "SUBSCRIPTION_PLAN") {
        return envPlanId;
      }
    } catch {
      // 無効/別マーチャントのIDの場合はフォールバック
    }
  }

  // なければ検索
  try {
    const { objects } = await squareClient.catalog.search({
      objectTypes: ["SUBSCRIPTION_PLAN"],
      query: {
        exactQuery: {
          attributeName: "name",
          attributeValue: PREMIUM_PLAN_NAME,
        },
      },
    });

    if (objects && objects.length > 0) {
      return objects[0].id;
    }

    // なければ作成（Plan自体には価格/フェーズを持たず、Variation側に持たせる）
    const { catalogObject } = await squareClient.catalog.object.upsert({
      idempotencyKey: randomUUID(),
      object: {
        type: "SUBSCRIPTION_PLAN",
        id: "#okipoka-premium-plan",
        subscriptionPlanData: {
          name: PREMIUM_PLAN_NAME,
        },
      },
    });

    return catalogObject?.id;
  } catch (error) {
    console.error("Failed to get or create subscription plan:", error);
    throw error;
  }
}

// STATIC pricing のフェーズを持つ Variation かどうかを判定
function hasStaticPhase(object: Square.CatalogObject | undefined): boolean {
  if (!object || object.type !== "SUBSCRIPTION_PLAN_VARIATION") return false;
  const phases = object.subscriptionPlanVariationData?.phases ?? [];
  return phases.some((p) => p.pricing?.type === "STATIC");
}

export async function getSubscriptionPlanVariationId(): Promise<string> {
  const envVariationId = process.env.SQUARE_SUBSCRIPTION_PLAN_VARIATION_ID;
  if (envVariationId) {
    try {
      const { object } = await squareClient.catalog.object.get({
        objectId: envVariationId,
        includeRelatedObjects: false,
      });
      if (hasStaticPhase(object)) return envVariationId;
    } catch {
      // 無効/別マーチャントのIDの場合はフォールバック
    }
  }

  const planId = await getOrCreateSubscriptionPlan();
  if (!planId) {
    throw new Error("Subscription plan not configured");
  }

  // Planに紐づくVariationは related_objects に含まれない場合があるため search で取得する
  const { objects } = await squareClient.catalog.search({
    objectTypes: ["SUBSCRIPTION_PLAN_VARIATION"],
    query: {
      exactQuery: {
        attributeName: "subscription_plan_id",
        attributeValue: planId,
      },
    },
  });

  // Subscription作成で確実に動くのはSTATIC pricingのVariation
  const staticVariation = (objects ?? []).find((o) => hasStaticPhase(o));
  if (staticVariation?.id) return staticVariation.id;

  // Variationが無い場合は自動作成（Sandbox初期構築用）
  const tempVariationId = "#okipoka-premium-variation";
  const { idMappings } = await squareClient.catalog.batchUpsert({
    idempotencyKey: randomUUID(),
    batches: [
      {
        objects: [
          {
            type: "SUBSCRIPTION_PLAN_VARIATION",
            id: tempVariationId,
            subscriptionPlanVariationData: {
              name: "月額 2,200円",
              subscriptionPlanId: planId,
              phases: [
                {
                  cadence: "MONTHLY",
                  pricing: {
                    type: "STATIC",
                    priceMoney: {
                      amount: BigInt(2200),
                      currency: "JPY",
                    },
                  },
                },
              ],
            },
          },
        ],
      },
    ],
  });

  const mapping = (idMappings ?? []).find(
    (m) => m.clientObjectId === tempVariationId
  );

  if (mapping?.objectId) {
    return mapping.objectId;
  }

  throw new Error(
    "Failed to create SUBSCRIPTION_PLAN_VARIATION. Set SQUARE_SUBSCRIPTION_PLAN_VARIATION_ID manually if needed."
  );
}
