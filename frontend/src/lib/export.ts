import { Quote, QuoteTotals } from "./types";
import { getItemWeight } from "./calculations";

export function exportToJSON(quote: Quote, totals: QuoteTotals): string {
  return JSON.stringify(
    {
      quote: {
        id: quote.id,
        customerName: quote.customerName,
        customerHandle: quote.customerHandle,
        orderId: quote.orderId,
        createdAt: quote.createdAt,
        settings: {
          exchangeRate: quote.exchangeRate,
          fixedFeeUsd: quote.fixedFeeUsd,
          shippingPerKgUsd: quote.shippingPerKgUsd,
          insuranceRate: quote.insuranceRate,
          haulFeeUsd: quote.haulFeeUsd,
        },
        items: quote.items.map((item) => ({
          name: item.name,
          link: item.link,
          yuan: item.yuan,
          usd: totals.itemCosts.find((c) => c.id === item.id)?.usd ?? 0,
          type: item.type,
          weightGrams: getItemWeight(item),
          included: item.include,
        })),
        totals: {
          totalItemCost: totals.totalItemCost,
          haulFee: totals.haulFee,
          totalWeightKg: totals.totalWeightKg,
          shippingEstimate: totals.shipping,
          insuranceEstimate: totals.insurance,
          grandTotal: totals.grandTotal,
        },
      },
    },
    null,
    2
  );
}

export function exportToCSV(quote: Quote, totals: QuoteTotals): string {
  const headers = ["Name", "Link", "Yuan", "USD", "Type", "Weight (g)", "Included"];
  const rows = quote.items.map((item) => {
    const usd = totals.itemCosts.find((c) => c.id === item.id)?.usd ?? 0;
    return [
      escapeCsv(item.name),
      escapeCsv(item.link),
      item.yuan.toString(),
      usd.toFixed(2),
      item.type,
      getItemWeight(item).toString(),
      item.include ? "Yes" : "No",
    ].join(",");
  });

  const summaryRows = [
    "",
    `Total Item Cost,$${totals.totalItemCost.toFixed(2)}`,
    `Haul Fee,$${totals.haulFee.toFixed(2)}`,
    `Total Weight,${totals.totalWeightKg.toFixed(1)}kg`,
    `Shipping Estimate,$${totals.shipping.toFixed(2)}`,
    `Insurance Estimate,$${totals.insurance.toFixed(2)}`,
    `Grand Total,$${totals.grandTotal.toFixed(2)}`,
  ];

  return [headers.join(","), ...rows, ...summaryRows].join("\n");
}

function escapeCsv(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
