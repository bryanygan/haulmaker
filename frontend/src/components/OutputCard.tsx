"use client";

import { Quote, QuoteTotals } from "@/lib/types";
import { formatDiscordMessage } from "@/lib/discord";
import { exportToJSON, exportToCSV, downloadFile } from "@/lib/export";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, Download, FileJson, FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";

interface OutputCardProps {
  quote: Quote;
  totals: QuoteTotals;
}

export function OutputCard({ quote, totals }: OutputCardProps) {
  const discordMessage = formatDiscordMessage(quote, totals);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(discordMessage);
      toast.success("Copied to clipboard!");
    } catch {
      toast.error("Failed to copy to clipboard");
    }
  }

  function handleExportJSON() {
    const json = exportToJSON(quote, totals);
    const filename = `order-${quote.customerName.replace(/\s+/g, "-").toLowerCase()}-${quote.id.slice(0, 8)}.json`;
    downloadFile(json, filename, "application/json");
    toast.success("JSON exported");
  }

  function handleExportCSV() {
    const csv = exportToCSV(quote, totals);
    const filename = `order-${quote.customerName.replace(/\s+/g, "-").toLowerCase()}-${quote.id.slice(0, 8)}.csv`;
    downloadFile(csv, filename, "text/csv");
    toast.success("CSV exported");
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Discord Output</CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleCopy}>
              <Copy className="mr-1 h-3 w-3" />
              Copy
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportJSON}>
              <FileJson className="mr-1 h-3 w-3" />
              JSON
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportCSV}>
              <FileSpreadsheet className="mr-1 h-3 w-3" />
              CSV
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <pre className="whitespace-pre-wrap rounded-lg bg-muted p-4 text-sm font-mono leading-relaxed">
          {discordMessage}
        </pre>
      </CardContent>
    </Card>
  );
}
