"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Quote, CreateItemPayload, UpdateQuotePayload, UpdateItemPayload, QuoteStatus, QUOTE_STATUSES, STATUS_COLORS } from "@/lib/types";
import { getQuote, updateQuote, createItem, updateItem, deleteItem } from "@/lib/api";
import { computeTotals } from "@/lib/calculations";
import { AddItemForm } from "@/components/AddItemForm";
import { ItemsTable } from "@/components/ItemsTable";
import { SettingsCard } from "@/components/SettingsCard";
import { NotesCard } from "@/components/NotesCard";
import { SummaryCard } from "@/components/SummaryCard";
import { OutputCard } from "@/components/OutputCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

export function QuoteEditor({ id }: { id: string }) {
  const router = useRouter();
  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchQuote = useCallback(async () => {
    try {
      const data = await getQuote(id);
      setQuote(data);
    } catch {
      toast.error("Failed to load order");
      router.push("/quotes");
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => {
    fetchQuote();
  }, [fetchQuote]);

  const handleUpdateQuote = useCallback(
    async (data: UpdateQuotePayload) => {
      if (!quote) return;
      try {
        const updated = await updateQuote(quote.id, data);
        setQuote(updated);
      } catch {
        toast.error("Failed to save changes");
      }
    },
    [quote]
  );

  const handleAddItem = useCallback(
    async (data: CreateItemPayload) => {
      if (!quote) return;
      try {
        const item = await createItem(quote.id, data);
        setQuote((prev) => (prev ? { ...prev, items: [...prev.items, item] } : null));
        toast.success("Item added");
      } catch {
        toast.error("Failed to add item");
      }
    },
    [quote]
  );

  const handleUpdateItem = useCallback(
    async (itemId: string, data: UpdateItemPayload) => {
      try {
        const updated = await updateItem(itemId, data);
        setQuote((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            items: prev.items.map((i) => (i.id === itemId ? { ...updated, quoteId: prev.id } : i)),
          };
        });
      } catch {
        toast.error("Failed to update item");
      }
    },
    []
  );

  const handleDeleteItem = useCallback(
    async (itemId: string) => {
      try {
        await deleteItem(itemId);
        setQuote((prev) => {
          if (!prev) return null;
          return { ...prev, items: prev.items.filter((i) => i.id !== itemId) };
        });
        toast.success("Item removed");
      } catch {
        toast.error("Failed to delete item");
      }
    },
    []
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 animate-pulse rounded bg-muted" />
          <div className="space-y-2">
            <div className="h-6 w-40 animate-pulse rounded bg-muted" />
            <div className="h-4 w-56 animate-pulse rounded bg-muted" />
          </div>
        </div>
        <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
          <div className="space-y-6">
            <Card className="animate-pulse"><CardContent className="py-16" /></Card>
            <Card className="animate-pulse"><CardContent className="py-24" /></Card>
          </div>
          <div className="space-y-6">
            <Card className="animate-pulse"><CardHeader className="pb-3"><div className="h-5 w-20 rounded bg-muted" /></CardHeader><CardContent className="space-y-3">{[1,2,3,4,5].map(i=><div key={i} className="h-8 rounded bg-muted" />)}</CardContent></Card>
            <Card className="animate-pulse"><CardHeader className="pb-3"><div className="h-5 w-20 rounded bg-muted" /></CardHeader><CardContent className="space-y-2">{[1,2,3,4].map(i=><div key={i} className="h-4 rounded bg-muted" />)}</CardContent></Card>
          </div>
        </div>
      </div>
    );
  }

  if (!quote) return null;

  const totals = computeTotals(quote);
  const hasWeightWarning = quote.items.some(
    (i) => i.include && i.type === "custom" && (i.weightGrams === null || i.weightGrams === undefined)
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push("/quotes")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{quote.customerName}</h1>
          <p className="text-sm text-muted-foreground">
            {quote.orderId && <span>{quote.orderId} &middot; </span>}
            Last updated {new Date(quote.updatedAt).toLocaleString()}
          </p>
        </div>
        <Select
          value={quote.status}
          onValueChange={(v) => handleUpdateQuote({ status: v as QuoteStatus })}
        >
          <SelectTrigger className={`h-8 w-32 text-xs font-medium ${STATUS_COLORS[quote.status as QuoteStatus] || ""}`}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {QUOTE_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {hasWeightWarning && (
        <div className="rounded-lg border border-yellow-300 bg-yellow-50 p-3 text-sm text-yellow-800 dark:border-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-200">
          Some custom items are missing weights. Shipping estimate may be inaccurate.
        </div>
      )}

      {/* On mobile: summary + output first, then items. On desktop: items left, sidebar right */}
      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        {/* Left column: items (shown second on mobile) */}
        <div className="order-2 space-y-6 lg:order-1">
          <AddItemForm onAdd={handleAddItem} />
          <div className="overflow-x-auto">
            <ItemsTable
              items={quote.items}
              exchangeRate={quote.exchangeRate}
              fixedFeeUsd={quote.fixedFeeUsd}
              onUpdateItem={handleUpdateItem}
              onDeleteItem={handleDeleteItem}
            />
          </div>
          {totals.refundedItems.length > 0 && (
            <div className="rounded-lg border border-red-200 dark:border-red-800">
              <div className="border-b border-red-200 bg-red-50 px-4 py-2 dark:border-red-800 dark:bg-red-900/20">
                <h3 className="text-sm font-semibold text-red-700 dark:text-red-300">Refunded Items</h3>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-red-50/50 dark:bg-red-900/10">
                    <th className="px-4 py-2 text-left font-medium">Item</th>
                    <th className="px-4 py-2 text-right font-medium">Credit</th>
                  </tr>
                </thead>
                <tbody>
                  {totals.refundedItems.map((item) => (
                    <tr key={item.id} className="border-b last:border-b-0">
                      <td className="px-4 py-2">{item.name}</td>
                      <td className="px-4 py-2 text-right font-medium text-red-600 dark:text-red-400">
                        -${item.usd.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t bg-red-50/50 dark:bg-red-900/10">
                    <td className="px-4 py-2 font-semibold">Total Credit</td>
                    <td className="px-4 py-2 text-right font-bold text-red-600 dark:text-red-400">
                      -${totals.totalCredit.toFixed(2)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>

        {/* Right column: settings, summary, output (shown first on mobile) */}
        <div className="order-1 space-y-6 lg:order-2">
          <SettingsCard quote={quote} onUpdate={handleUpdateQuote} />
          <NotesCard quote={quote} onUpdate={handleUpdateQuote} />
          <SummaryCard totals={totals} />
          <OutputCard quote={quote} totals={totals} />
        </div>
      </div>
    </div>
  );
}
