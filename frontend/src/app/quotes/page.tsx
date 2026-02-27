"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Quote } from "@/lib/types";
import { getQuotes, createQuote, deleteQuote } from "@/lib/api";
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

export default function QuotesPage() {
  const router = useRouter();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
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

  async function handleDelete(e: React.MouseEvent, id: string) {
    e.stopPropagation();
    if (!confirm("Delete this quote?")) return;
    try {
      await deleteQuote(id);
      setQuotes((prev) => prev.filter((q) => q.id !== id));
      toast.success("Quote deleted");
    } catch {
      toast.error("Failed to delete quote");
    }
  }

  async function handleDuplicate(e: React.MouseEvent, quote: Quote) {
    e.stopPropagation();
    try {
      const newQuote = await createQuote({
        customerName: `${quote.customerName} (Copy)`,
        customerHandle: quote.customerHandle || undefined,
        orderId: quote.orderId || undefined,
      });
      toast.success("Quote duplicated");
      router.push(`/editor?id=${newQuote.id}`);
    } catch {
      toast.error("Failed to duplicate quote");
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted-foreground">Loading quotes...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Quotes</h1>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Quote
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

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            {quotes.length === 0 ? "No quotes yet. Create your first one!" : "No quotes match your search."}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((quote) => (
            <Card
              key={quote.id}
              className="cursor-pointer transition-shadow hover:shadow-md"
              onClick={() => router.push(`/quotes/${quote.id}`)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{quote.customerName}</CardTitle>
                    {quote.customerHandle && (
                      <p className="text-sm text-muted-foreground">{quote.customerHandle}</p>
                    )}
                  </div>
                  {quote.orderId && <Badge variant="outline">{quote.orderId}</Badge>}
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>{quote.items.length} item{quote.items.length !== 1 ? "s" : ""}</span>
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
                    onClick={(e) => handleDelete(e, quote.id)}
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
    </div>
  );
}
