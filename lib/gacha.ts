/** Admin/public gacha item fields used for eligibility and rate stats */
export type GachaItemLike = {
  id?: string;
  is_active?: boolean | null;
  deleted_at?: string | null;
  type?: string | null;
  probability?: number | null;
  cost_yen?: number | null;
  stock_total?: number | null;
  stock_used?: number | null;
  current_stock_used?: number | null;
};

export function isGachaItemEligible(item: GachaItemLike): boolean {
  if (item.is_active === false) return false;
  if (item.deleted_at) return false;
  if (typeof item.stock_total === "number") {
    const used = Number(item.current_stock_used ?? item.stock_used ?? 0);
    return used < item.stock_total;
  }
  return true;
}

export type GachaRateStats = {
  eligibleItems: GachaItemLike[];
  totalWeight: number;
  winWeight: number;
  loseWeight: number;
  winRate: number;
  expectedValueYen: number;
  maxExpectedValueYen: number;
};

export function computeGachaRateStats(items: GachaItemLike[]): GachaRateStats {
  const eligibleItems = items.filter(isGachaItemEligible);

  const totalWeight = eligibleItems.reduce(
    (sum, it) => sum + (it.probability || 0),
    0
  );
  const winWeight = eligibleItems
    .filter((it) => it.type !== "none")
    .reduce((sum, it) => sum + (it.probability || 0), 0);
  const loseWeight = eligibleItems
    .filter((it) => it.type === "none")
    .reduce((sum, it) => sum + (it.probability || 0), 0);

  const winRate = totalWeight > 0 ? (winWeight / totalWeight) * 100 : 0;

  const winCostSum = eligibleItems
    .filter((it) => it.type !== "none")
    .reduce((sum, it) => sum + (it.probability || 0) * (it.cost_yen || 0), 0);

  const expectedValueYen = totalWeight > 0 ? winCostSum / totalWeight : 0;
  const maxExpectedValueYen = winWeight > 0 ? winCostSum / winWeight : 0;

  return {
    eligibleItems,
    totalWeight,
    winWeight,
    loseWeight,
    winRate,
    expectedValueYen,
    maxExpectedValueYen,
  };
}

export function gachaAppearancePct(
  item: GachaItemLike,
  totalWeight: number
): string | null {
  if (!isGachaItemEligible(item) || totalWeight <= 0) return null;
  return ((item.probability || 0) / totalWeight * 100).toFixed(1);
}
