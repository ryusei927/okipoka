// アプリ内部で扱うサブスクのステータス表記
export type DbSubscriptionStatus = "active" | "canceling" | "canceled" | "past_due";

/**
 * Square のサブスクステータス（ACTIVE など）をアプリ内部の表記に変換する。
 * 対応外のステータス（PENDING / DEACTIVATED / PAUSED など）は null を返す。
 */
export function mapSquareStatusToDb(
  status?: string | null
): DbSubscriptionStatus | null {
  switch (status) {
    case "ACTIVE":
      return "active";
    case "CANCELING":
      return "canceling";
    case "CANCELED":
      return "canceled";
    case "PAST_DUE":
      return "past_due";
    default:
      return null;
  }
}

/**
 * 「有効として扱ってよい」Square サブスクステータスか判定する。
 *
 * Square のサブスクステータスに CANCELING / PAST_DUE は存在せず、解約予約は
 * status=ACTIVE + 未来日の canceledDate で表現される。そのため有効サブスクの
 * 探索では ACTIVE を拾えれば十分だが、将来の仕様変更に備えて防御的に残す。
 */
export function isActiveLikeStatus(status?: string | null): boolean {
  return status === "ACTIVE" || status === "CANCELING" || status === "PAST_DUE";
}

/**
 * Square のサブスクオブジェクトからアプリ内部のステータスを導出する。
 *
 * Square が ACTIVE を返していても解約予約（canceledDate が未来日）が
 * 入っている場合があるため、それを「解約予定（canceling）」として補完する。
 *
 * Webhook の生 JSON（snake_case）からも呼べるよう、status / canceledDate は
 * ゆるい文字列型で受ける。
 */
export function deriveDbStatusFromSubscription(
  subscription: { status?: string | null; canceledDate?: string | null } | null | undefined
): DbSubscriptionStatus | null {
  const mapped = mapSquareStatusToDb(subscription?.status ?? null);
  if (mapped && mapped !== "active") return mapped;

  const canceledDate =
    typeof subscription?.canceledDate === "string" ? subscription.canceledDate : null;
  if (canceledDate) {
    const today = new Date().toISOString().slice(0, 10);
    if (canceledDate > today) return "canceling";
  }

  return mapped; // active または null
}

/** YYYY-MM-DD 文字列に日数を加算する（UTC基準） */
export function addDays(ymd: string, days: number): string {
  const [y, m, d] = ymd.split("-").map((v) => Number(v));
  const date = new Date(Date.UTC(y, m - 1, d));
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

/** chargedThroughDate（請求済み最終日）から次回更新日を求める */
export function nextRenewalDateFrom(chargedThroughDate?: string | null): string | null {
  return chargedThroughDate ? addDays(chargedThroughDate, 1) : null;
}

/**
 * 新SDKのレスポンスには bigint（subscription.version など）が含まれるため、
 * そのまま JSON.stringify すると例外になる。bigint を文字列へ変換した
 * JSON セーフな複製を返す。
 */
export function toJsonSafe<T>(value: T): unknown {
  return JSON.parse(
    JSON.stringify(value, (_key, v) => (typeof v === "bigint" ? v.toString() : v))
  );
}
