import { Item, Quote, QuoteTotals, DEFAULT_WEIGHTS, ItemType } from "./types";

export function computeItemUsd(yuan: number, exchangeRate: number, fixedFeeUsd: number): number {
  return Math.round(((yuan / exchangeRate) + fixedFeeUsd) * 100) / 100;
}

export function getItemWeight(item: Item): number {
  if (item.weightGrams !== null && item.weightGrams !== undefined) {
    return item.weightGrams;
  }
  return DEFAULT_WEIGHTS[item.type as ItemType] ?? 0;
}

export function computeTotals(quote: Quote): QuoteTotals {
  const { exchangeRate, fixedFeeUsd, shippingPerKgUsd, insuranceRate, haulFeeUsd, items } = quote;

  const itemCosts = items.map((item) => ({
    id: item.id,
    name: item.name,
    usd: computeItemUsd(item.yuan, exchangeRate, fixedFeeUsd),
    included: item.include,
    status: item.status,
  }));

  const includedItems = itemCosts.filter((i) => i.included);
  const totalItemCost = includedItems.reduce((sum, i) => sum + i.usd, 0);

  const includedRawItems = items.filter((i) => i.include);
  const totalWeightGrams = includedRawItems.reduce((sum, i) => sum + getItemWeight(i), 0);
  const totalWeightKg = totalWeightGrams / 1000;

  const shipping = Math.round(totalWeightKg * shippingPerKgUsd * 100) / 100;
  const insurance = Math.round(totalItemCost * insuranceRate * 100) / 100;

  const grandTotal = Math.round((totalItemCost + haulFeeUsd + shipping + insurance) * 100) / 100;

  const refundedItems = itemCosts
    .filter((i) => i.status === "refunded" && i.included)
    .map((i) => ({ id: i.id, name: i.name, usd: i.usd }));
  const totalCredit = Math.round(refundedItems.reduce((sum, i) => sum + i.usd, 0) * 100) / 100;

  return {
    itemCosts,
    totalItemCost: Math.round(totalItemCost * 100) / 100,
    totalWeightKg: Math.round(totalWeightKg * 1000) / 1000,
    shipping,
    insurance,
    haulFee: haulFeeUsd,
    grandTotal,
    refundedItems,
    totalCredit,
  };
}
