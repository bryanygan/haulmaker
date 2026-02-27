"use client";

import { QuoteTotals } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface SummaryCardProps {
  totals: QuoteTotals;
}

export function SummaryCard({ totals }: SummaryCardProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Summary</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Items Included</span>
            <span>{totals.itemCosts.filter((i) => i.included).length}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Total Item Cost</span>
            <span className="font-medium">${totals.totalItemCost.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Haul Fee</span>
            <span>${totals.haulFee.toFixed(2)}</span>
          </div>
          <hr />
          <div className="flex justify-between">
            <span className="text-muted-foreground">Item Cost + Fees</span>
            <span className="font-medium">
              ${(totals.totalItemCost + totals.haulFee).toFixed(2)}
            </span>
          </div>
          <hr />
          <div className="flex justify-between">
            <span className="text-muted-foreground">Total Weight</span>
            <span>{totals.totalWeightKg.toFixed(1)} kg</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Shipping Estimate</span>
            <span>${totals.shipping.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Insurance Estimate</span>
            <span>${totals.insurance.toFixed(2)}</span>
          </div>
          <hr />
          <div className="flex justify-between text-base font-bold">
            <span>Grand Total (Est.)</span>
            <span>${totals.grandTotal.toFixed(2)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
