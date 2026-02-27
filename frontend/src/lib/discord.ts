import { Quote, QuoteTotals } from "./types";

export function formatDiscordMessage(quote: Quote, totals: QuoteTotals): string {
  const lines: string[] = [];

  // Item lines (only included)
  const includedItems = totals.itemCosts.filter((i) => i.included);
  for (const item of includedItems) {
    lines.push(`${item.name} - $${item.usd.toFixed(2)}`);
  }

  lines.push("");
  lines.push(`Flat Rate Haul Fee - $${totals.haulFee}`);

  lines.push("");
  const totalPlusFees = Math.round((totals.totalItemCost + totals.haulFee) * 100) / 100;
  lines.push(`Total Item Cost + Fees - $${totalPlusFees.toFixed(2)}`);

  lines.push("");
  lines.push(
    `International Shipping - TBD (Estimate: ${totals.totalWeightKg.toFixed(1)}kg * $${quote.shippingPerKgUsd}/kg = $${totals.shipping.toFixed(2)})`
  );

  lines.push("");
  lines.push(
    `International Shipping Insurance (${Math.round(quote.insuranceRate * 100)}% of item cost, full refund if lost/seized): TBD (Estimate: $${totals.insurance.toFixed(2)})`
  );

  lines.push("");
  lines.push(
    "Total Item Cost + Fees are paid upfront, and once everything arrives at the China warehouse, I'll provide an accurate shipping and insurance quote."
  );

  return lines.join("\n");
}
