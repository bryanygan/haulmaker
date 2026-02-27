"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Quote } from "@/lib/types";
import { getQuotes, createQuote, deleteQuote, duplicateQuote } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Search, Copy } from "lucide-react";
import { toast } from "sonner";

function QuoteCardSkeleton() {
  return (
    <Card className="animate-pulse">
      <CardHeader className="pb-3">
        <div className="h-5 w-32 rounded bg-muted" />
        <div className="mt-1 h-4 w-20 rounded bg-muted" />
      </CardHeader>
      <CardContent>
        <div className="flex justify-between">
          <div className="h-4 w-16 rounded bg-muted" />
          <div className="h-4 w-20 rounded bg-muted" />
        </div>
      </CardContent>
    </Card>
  );
}

export default function QuotesPage() {
  const router = useRouter();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [newCustomerName, setNewCustomerName] = useState("");
  const [newCustomerHandle, setNewCustomerHandle] = useState("");
  const [newOrderId, setNewOrderId] = useState("");

  const fetchQuotes = useCallback(async () => {
    try {
      const data = await getQuotes();
      setQuotes(data);
    } catch {
      toast.error("Failed to load quotes");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchQuotes();
  }, [fetchQuotes]);

  const filtered = quotes.filter((q) => {
    const term = search.toLowerCase();
    return (
      q.customerName.toLowerCase().includes(term) ||
      (q.orderId && q.orderId.toLowerCase().includes(term)) ||
      (q.customerHandle && q.customerHandle.toLowerCase().includes(term))
    );
  });

  async function handleCreate() {
    if (!newCustomerName.trim()) {
      toast.error("Customer name is required");
      return;
    }
    try {
      const quote = await createQuote({
        customerName: newCustomerName.trim(),
        customerHandle: newCustomerHandle.trim() || undefined,
        orderId: newOrderId.trim() || undefined,
      });
      setDialogOpen(false);
      setNewCustomerName("");
      setNewCustomerHandle("");
      setNewOrderId("");
      toast.success("Quote created");
      router.push(`/editor?id=${quote.id}`);
    } catch {
      toast.error("Failed to create quote");
    }
  }

  function confirmDelete(e: React.MouseEvent, id: string) {
    e.stopPropagation();
    setDeleteTarget(id);
    setDeleteDialogOpen(true);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await deleteQuote(deleteTarget);
      setQuotes((prev) => prev.filter((q) => q.id !== deleteTarget));
      toast.success("Quote deleted");
    } catch {
      toast.error("Failed to delete quote");
    } finally {
      setDeleteDialogOpen(false);
      setDeleteTarget(null);
    }
  }

  async function handleDuplicate(e: React.MouseEvent, quote: Quote) {
    e.stopPropagation();
    try {
      const newQuote = await duplicateQuote(quote.id);
      toast.success("Quote duplicated with all items");
      router.push(`/editor?id=${newQuote.id}`);
    } catch {
      toast.error("Failed to duplicate quote");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold sm:text-3xl">Quotes</h1>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          <span className="hidden sm:inline">New Quote</span>
          <span className="sm:hidden">New</span>
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by customer or order ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <QuoteCardSkeleton key={i} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            {quotes.length === 0
              ? "No quotes yet. Create your first one!"
              : "No quotes match your search."}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((quote) => (
            <Card
              key={quote.id}
              className="cursor-pointer transition-shadow hover:shadow-md"
              onClick={() => router.push(`/editor?id=${quote.id}`)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <CardTitle className="truncate text-lg">{quote.customerName}</CardTitle>
                    {quote.customerHandle && (
                      <p className="truncate text-sm text-muted-foreground">
                        {quote.customerHandle}
                      </p>
                    )}
                  </div>
                  {quote.orderId && <Badge variant="outline" className="shrink-0">{quote.orderId}</Badge>}
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>
                    {quote.items.length} item{quote.items.length !== 1 ? "s" : ""}
                  </span>
                  <span>{new Date(quote.updatedAt).toLocaleDateString()}</span>
                </div>
                <div className="mt-3 flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => handleDuplicate(e, quote)}
                    title="Duplicate"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => confirmDelete(e, quote.id)}
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Quote Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Quote</DialogTitle>
            <DialogDescription>Create a new haul quote for a customer.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="customerName">Customer Name *</Label>
              <Input
                id="customerName"
                value={newCustomerName}
                onChange={(e) => setNewCustomerName(e.target.value)}
                placeholder="e.g. Bryan"
                onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customerHandle">Discord Handle</Label>
              <Input
                id="customerHandle"
                value={newCustomerHandle}
                onChange={(e) => setNewCustomerHandle(e.target.value)}
                placeholder="e.g. @bryan"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="orderId">Order ID</Label>
              <Input
                id="orderId"
                value={newOrderId}
                onChange={(e) => setNewOrderId(e.target.value)}
                placeholder="e.g. ZR-001"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Quote</DialogTitle>
            <DialogDescription>
              This will permanently delete this quote and all its items. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
