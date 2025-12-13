import { randomUUID } from "crypto";

const isProduction = process.env.SQUARE_ENVIRONMENT === "production";
const BASE_URL = isProduction
  ? "https://connect.squareup.com"
  : "https://connect.squareupsandbox.com";

const ACCESS_TOKEN = process.env.SQUARE_ACCESS_TOKEN;
const SQUARE_VERSION = process.env.SQUARE_VERSION || "2025-10-16";

async function squareFetch(path: string, method: string = "GET", body?: any) {
  if (!ACCESS_TOKEN) {
    throw new Error("SQUARE_ACCESS_TOKEN is missing in environment variables");
  }

  const url = `${BASE_URL}${path}`;
  const headers = {
    "Authorization": `Bearer ${ACCESS_TOKEN}`,
    "Square-Version": SQUARE_VERSION,
    "Content-Type": "application/json",
  };

  // BigIntをJSONにするための変換
  const bodyString = body ? JSON.stringify(body, (key, value) =>
    typeof value === "bigint" ? Number(value) : value
  ) : undefined;

  const res = await fetch(url, {
    method,
    headers,
    body: bodyString,
  });

  const data = await res.json();

  if (!res.ok) {
    console.error(`Square API Error (${path}):`, JSON.stringify(data, null, 2));
    throw new Error(data.errors?.[0]?.detail || "Square API Request Failed");
  }

  return { result: data };
}

// SDKのインターフェースを模倣したクライアント
export const squareClient = {
  locations: {
    list: async () => {
      return squareFetch("/v2/locations", "GET");
    },
  },
  customers: {
    create: async (params: any) => {
      return squareFetch("/v2/customers", "POST", params);
    },
  },
  cards: {
    create: async (params: any) => {
      return squareFetch("/v2/cards", "POST", params);
    },
  },
  subscriptions: {
    create: async (params: any) => {
      return squareFetch("/v2/subscriptions", "POST", params);
    },
    update: async (subscriptionId: string, params: any) => {
      const encodedId = encodeURIComponent(subscriptionId);
      return squareFetch(`/v2/subscriptions/${encodedId}`, "PUT", params);
    },
    cancel: async (subscriptionId: string) => {
      const encodedId = encodeURIComponent(subscriptionId);
      return squareFetch(`/v2/subscriptions/${encodedId}/cancel`, "POST");
    },
    resume: async (subscriptionId: string) => {
      const encodedId = encodeURIComponent(subscriptionId);
      return squareFetch(`/v2/subscriptions/${encodedId}/resume`, "POST");
    },
    retrieve: async (subscriptionId: string) => {
      const encodedId = encodeURIComponent(subscriptionId);
      return squareFetch(`/v2/subscriptions/${encodedId}`, "GET");
    },
  },
  catalog: {
    search: async (params: any) => {
      return squareFetch("/v2/catalog/search", "POST", params);
    },
    batchUpsert: async (params: any) => {
      return squareFetch("/v2/catalog/batch-upsert", "POST", params);
    },
    object: {
      upsert: async (params: any) => {
        return squareFetch("/v2/catalog/object", "POST", params);
      },
      retrieve: async (objectId: string, includeRelatedObjects: boolean = true) => {
        const encodedId = encodeURIComponent(objectId);
        const qs = includeRelatedObjects ? "?include_related_objects=true" : "";
        return squareFetch(`/v2/catalog/object/${encodedId}${qs}`, "GET");
      },
    },
  },
};

export async function getOrCreateSubscriptionPlan() {
  // 環境変数にあればそれを使う
  const envPlanId = process.env.SQUARE_SUBSCRIPTION_PLAN_ID;
  if (envPlanId) {
    try {
      const { result } = await squareClient.catalog.object.retrieve(envPlanId, false);
      const obj = (result as { object?: { type?: unknown } }).object;
      if (obj && obj.type === "SUBSCRIPTION_PLAN") {
        return envPlanId;
      }
    } catch {
      // 無効/別マーチャントのIDの場合はフォールバック
    }
  }

  // なければ検索
  try {
    const { result } = await squareClient.catalog.search({
      object_types: ["SUBSCRIPTION_PLAN"],
      query: {
        exact_query: {
          attribute_name: "name",
          attribute_value: "OKIPOKA プレミアム会員"
        }
      }
    });

    if (result.objects && result.objects.length > 0) {
      return result.objects[0].id;
    }

    // なければ作成（Plan自体には価格/フェーズを持たず、Variation側に持たせる）
    const { result: createResult } = await squareClient.catalog.object.upsert({
      idempotency_key: randomUUID(),
      object: {
        type: "SUBSCRIPTION_PLAN",
        id: "#okipoka-premium-plan",
        subscription_plan_data: {
          name: "OKIPOKA プレミアム会員",
        },
      },
    });

    return createResult.catalog_object?.id;
  } catch (error) {
    console.error("Failed to get or create subscription plan:", error);
    throw error;
  }
}

export async function getSubscriptionPlanVariationId() {
  const envVariationId = process.env.SQUARE_SUBSCRIPTION_PLAN_VARIATION_ID;
  if (envVariationId) {
    try {
      const { result } = await squareClient.catalog.object.retrieve(envVariationId, false);
      const obj = (result as { object?: { type?: unknown } }).object;
      if (obj && obj.type === "SUBSCRIPTION_PLAN_VARIATION") {
        type VariationObj = {
          subscription_plan_variation_data?: {
            phases?: Array<{ pricing?: { type?: string } }>;
          };
        };

        const variationObj = obj as unknown as VariationObj;
        const phases = variationObj.subscription_plan_variation_data?.phases ?? [];
        const hasStatic = phases.some((p) => p.pricing?.type === "STATIC");
        if (hasStatic) return envVariationId;
      }
    } catch {
      // 無効/別マーチャントのIDの場合はフォールバック
    }
  }

  const planId = await getOrCreateSubscriptionPlan();
  if (!planId) {
    throw new Error("Subscription plan not configured");
  }

  // Planに紐づくVariationは related_objects に含まれない場合があるため search で取得する
  const { result: searchResult } = await squareClient.catalog.search({
    object_types: ["SUBSCRIPTION_PLAN_VARIATION"],
    query: {
      exact_query: {
        attribute_name: "subscription_plan_id",
        attribute_value: planId,
      },
    },
  });

  type SearchVariationObj = {
    id?: string;
    subscription_plan_variation_data?: {
      phases?: Array<{ pricing?: { type?: string } }>;
    };
  };

  const variations = (searchResult.objects ?? []) as unknown as SearchVariationObj[];

  // Subscription作成で確実に動くのはSTATIC pricingのVariation
  const staticVariation = variations.find((v) => {
    const phases = v?.subscription_plan_variation_data?.phases ?? [];
    return phases.some((p) => p.pricing?.type === "STATIC");
  });
  if (staticVariation?.id) return staticVariation.id;

  // Variationが無い場合は自動作成（Sandbox初期構築用）
  const tempVariationId = "#okipoka-premium-variation";
  const { result: upsertResult } = await squareClient.catalog.batchUpsert({
    idempotency_key: randomUUID(),
    batches: [
      {
        objects: [
          {
            type: "SUBSCRIPTION_PLAN_VARIATION",
            id: tempVariationId,
            subscription_plan_variation_data: {
              name: "月額 2,200円",
              subscription_plan_id: planId,
              phases: [
                {
                  cadence: "MONTHLY",
                  pricing: {
                    type: "STATIC",
                    price_money: {
                      amount: 2200,
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

  const mapping = (upsertResult.id_mappings ?? []).find(
    (m: any) => m.client_object_id === tempVariationId
  );

  if (mapping?.object_id) {
    return mapping.object_id;
  }

  throw new Error(
    "Failed to create SUBSCRIPTION_PLAN_VARIATION. Set SQUARE_SUBSCRIPTION_PLAN_VARIATION_ID manually if needed."
  );
}
