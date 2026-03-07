"use client";

import { useEffect, useState, useCallback } from "react";
import { Quote, Item, ItemStatus, ITEM_STATUSES, ITEM_STATUS_COLORS, UpdateItemPayload, QuoteStatus, STATUS_COLORS } from "@/lib/types";
import { getQuotes, updateItem } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { StatusBoard } from "@/components/StatusBoard";
import { toast } from "sonner";
import { Package, CheckCircle2, Clock, ExternalLink } from "lucide-react";
import { useRouter } from "next/navigation";

export default function BoardsPage() {
  const router = useRouter();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const data = await getQuotes();
      setQuotes(data);
    } catch {
      toast.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleUpdateItem = useCallback(
    async (itemId: string, data: UpdateItemPayload) => {
      try {
        const updated = await updateItem(itemId, data);
        setQuotes((prev) =>
          prev.map((q) => ({
            ...q,
            items: q.items.map((i) =>
              i.id === itemId ? { ...i, ...updated } : i
            ),
          }))
        );
      } catch {
        toast.error("Failed to update item");
      }
    },
    []
  );

  // Only show quotes that have included items (something to track)
  const activeQuotes = quotes.filter(
    (q) => q.items.some((i) => i.include)
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold sm:text-3xl">All Boards</h1>
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse rounded-lg border p-6">
            <div className="mb-4 h-6 w-48 rounded bg-muted" />
            <div className="flex gap-3">
              {[1, 2, 3, 4].map((j) => (
                <div key={j} className="h-32 flex-1 rounded-lg bg-muted" />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold sm:text-3xl">All Boards</h1>

      {activeQuotes.length === 0 ? (
        <div className="rounded-lg border p-10 text-center text-muted-foreground">
          No orders with items to track.
        </div>
      ) : (
        activeQuotes.map((quote) => (
          <HaulBoard
            key={quote.id}
            quote={quote}
            onUpdateItem={handleUpdateItem}
            onNavigate={() => router.push(`/editor?id=${quote.id}`)}
          />
        ))
      )}
    </div>
  );
}

function HaulBoard({
  quote,
  onUpdateItem,
  onNavigate,
}: {
  quote: Quote;
  onUpdateItem: (id: string, data: UpdateItemPayload) => Promise<void>;
  onNavigate: () => void;
}) {
  const includedItems = quote.items.filter((i) => i.include);
  const arrivedCount = includedItems.filter((i) => i.status === "arrived").length;
  const refundedCount = includedItems.filter((i) => i.status === "refunded").length;
  const effectiveTotal = includedItems.length - refundedCount;
  const remaining = effectiveTotal - arrivedCount;
  const allArrived = effectiveTotal > 0 && remaining === 0;

  return (
    <div className="rounded-lg border">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3">
        <div className="flex items-center gap-3">
          <button
            onClick={onNavigate}
            className="text-lg font-semibold hover:underline"
          >
            {quote.customerName}
          </button>
          {quote.orderId && (
            <Badge variant="outline">{quote.orderId}</Badge>
          )}
          <Badge
            className={`${STATUS_COLORS[quote.status as QuoteStatus] || STATUS_COLORS.draft} border-0`}
          >
            {quote.status}
          </Badge>
        </div>

        <div className="flex items-center gap-4 text-sm">
          {allArrived ? (
            <span className="flex items-center gap-1.5 font-medium text-green-600 dark:text-green-400">
              <CheckCircle2 className="h-4 w-4" />
              Ready to ship
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <Clock className="h-4 w-4" />
              {remaining} of {effectiveTotal} item{effectiveTotal !== 1 ? "s" : ""} remaining
            </span>
          )}
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <Package className="h-4 w-4" />
            {includedItems.length} total
          </span>
        </div>
      </div>

      {/* Board */}
      <div className="p-4">
        <StatusBoard items={quote.items} onUpdateItem={onUpdateItem} />
      </div>
    </div>
  );
}
