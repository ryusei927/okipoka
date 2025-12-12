import { Client, Environment } from "square";
import { randomUUID } from "crypto";

const isProduction = process.env.SQUARE_ENVIRONMENT === "production";

// Square SDK v38以降のインポート方法に対応
export const squareClient = new Client({
  accessToken: process.env.SQUARE_ACCESS_TOKEN,
  environment: isProduction ? Environment.Production : Environment.Sandbox,
});

export async function getOrCreateSubscriptionPlan() {
  // 環境変数にあればそれを使う
  if (process.env.SQUARE_SUBSCRIPTION_PLAN_ID) {
    return process.env.SQUARE_SUBSCRIPTION_PLAN_ID;
  }

  // なければ検索
  try {
    const { result } = await squareClient.catalogApi.searchCatalogObjects({
      objectTypes: ["SUBSCRIPTION_PLAN"],
      query: {
        exactQuery: {
          attributeName: "name",
          attributeValue: "OKIPOKA プレミアム会員"
        }
      }
    });

    if (result.objects && result.objects.length > 0) {
      return result.objects[0].id;
    }

    // なければ作成
    const { result: createResult } = await squareClient.catalogApi.upsertCatalogObject({
      idempotencyKey: randomUUID(),
      object: {
        type: "SUBSCRIPTION_PLAN",
        id: "#okipoka-premium-plan",
        subscriptionPlanData: {
          name: "OKIPOKA プレミアム会員",
          phases: [
            {
              cadence: "MONTHLY",
              recurringPriceMoney: {
                amount: BigInt(2200),
                currency: "JPY",
              },
            },
          ],
        },
      },
    });

    return createResult.catalogObject?.id;
  } catch (error) {
    console.error("Failed to get or create subscription plan:", error);
    throw error;
  }
}
