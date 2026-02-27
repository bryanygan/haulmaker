"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Quote, CreateItemPayload, UpdateQuotePayload, UpdateItemPayload } from "@/lib/types";
import { getQuote, updateQuote, createItem, updateItem, deleteItem } from "@/lib/api";
import { computeTotals } from "@/lib/calculations";
import { AddItemForm } from "@/components/AddItemForm";
import { ItemsTable } from "@/components/ItemsTable";
import { SettingsCard } from "@/components/SettingsCard";
import { SummaryCard } from "@/components/SummaryCard";
import { OutputCard } from "@/components/OutputCard";
import { Button } from "@/components/ui/button";
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
      toast.error("Failed to load quote");
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
      <div className="flex items-center justify-center py-20">
        <p className="text-muted-foreground">Loading quote...</p>
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
        <div>
          <h1 className="text-2xl font-bold">{quote.customerName}</h1>
          <p className="text-sm text-muted-foreground">
            {quote.orderId && <span>{quote.orderId} &middot; </span>}
            Last updated {new Date(quote.updatedAt).toLocaleString()}
          </p>
        </div>
      </div>

      {hasWeightWarning && (
        <div className="rounded-lg border border-yellow-300 bg-yellow-50 p-3 text-sm text-yellow-800">
          Some custom items are missing weights. Shipping estimate may be inaccurate.
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        {/* Left column: items */}
        <div className="space-y-6">
          <AddItemForm onAdd={handleAddItem} />
          <ItemsTable
            items={quote.items}
            exchangeRate={quote.exchangeRate}
            fixedFeeUsd={quote.fixedFeeUsd}
            onUpdateItem={handleUpdateItem}
            onDeleteItem={handleDeleteItem}
          />
        </div>

        {/* Right column: settings, summary, output */}
        <div className="space-y-6">
          <SettingsCard quote={quote} onUpdate={handleUpdateQuote} />
          <SummaryCard totals={totals} />
          <OutputCard quote={quote} totals={totals} />
        </div>
      </div>
    </div>
  );
}
