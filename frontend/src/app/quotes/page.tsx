"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Quote, Customer, Item, ItemStatus, ITEM_STATUSES, ITEM_STATUS_COLORS, QuoteStatus, QUOTE_STATUSES, STATUS_COLORS } from "@/lib/types";
import { getQuotes, createQuote, deleteQuote, duplicateQuote, getCustomers, createCustomer, updateItem } from "@/lib/api";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Plus, Trash2, Search, Copy, ExternalLink } from "lucide-react";
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
  const [statusFilter, setStatusFilter] = useState<QuoteStatus | "all">("all");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("new");
  const [saveAsCustomer, setSaveAsCustomer] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState("");
  const [newCustomerHandle, setNewCustomerHandle] = useState("");
  const [newOrderId, setNewOrderId] = useState("");

  const fetchData = useCallback(async () => {
    try {
      const [quotesData, customersData] = await Promise.all([getQuotes(), getCustomers()]);
      setQuotes(quotesData);
      setCustomers(customersData);
    } catch {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const term = search.toLowerCase().trim();

  const filtered = quotes.filter((q) => {
    const matchesSearch =
      !term ||
      q.customerName.toLowerCase().includes(term) ||
      (q.orderId && q.orderId.toLowerCase().includes(term)) ||
      (q.customerHandle && q.customerHandle.toLowerCase().includes(term)) ||
      q.items.some((i) => i.name.toLowerCase().includes(term));
    const matchesStatus = statusFilter === "all" || q.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Collect matching items when searching
  const itemResults = term
    ? quotes.flatMap((q) =>
        q.items
          .filter((i) => i.name.toLowerCase().includes(term))
          .map((i) => ({ item: i, quote: q }))
      )
    : [];

  const handleUpdateItemStatus = useCallback(
    async (itemId: string, status: ItemStatus | null) => {
      try {
        const updated = await updateItem(itemId, { status });
        setQuotes((prev) =>
          prev.map((q) => ({
            ...q,
            items: q.items.map((i) => (i.id === itemId ? { ...i, status: updated.status as ItemStatus | null } : i)),
          }))
        );
      } catch {
        toast.error("Failed to update status");
      }
    },
    []
  );

  function handleSelectCustomer(value: string) {
    setSelectedCustomerId(value);
    if (value !== "new") {
      const customer = customers.find((c) => c.id === value);
      if (customer) {
        setNewCustomerName(customer.name);
        setNewCustomerHandle(customer.discordHandle || "");
        setSaveAsCustomer(false);
      }
    } else {
      setNewCustomerName("");
      setNewCustomerHandle("");
    }
  }

  async function handleCreate() {
    if (!newCustomerName.trim()) {
      toast.error("Customer name is required");
      return;
    }
    try {
      let customerId: string | undefined;

      if (selectedCustomerId !== "new") {
        customerId = selectedCustomerId;
      } else if (saveAsCustomer) {
        const customer = await createCustomer({
          name: newCustomerName.trim(),
          discordHandle: newCustomerHandle.trim() || undefined,
        });
        customerId = customer.id;
        setCustomers((prev) => [...prev, customer]);
      }

      const quote = await createQuote({
        customerName: newCustomerName.trim(),
        customerHandle: newCustomerHandle.trim() || undefined,
        orderId: newOrderId.trim() || undefined,
        customerId,
      });
      setDialogOpen(false);
      setNewCustomerName("");
      setNewCustomerHandle("");
      setNewOrderId("");
      setSelectedCustomerId("new");
      setSaveAsCustomer(false);
      toast.success("Order created");
      router.push(`/editor?id=${quote.id}`);
    } catch {
      toast.error("Failed to create order");
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
      toast.success("Order deleted");
    } catch {
      toast.error("Failed to delete order");
    } finally {
      setDeleteDialogOpen(false);
      setDeleteTarget(null);
    }
  }

  async function handleDuplicate(e: React.MouseEvent, quote: Quote) {
    e.stopPropagation();
    try {
      const newQuote = await duplicateQuote(quote.id);
      toast.success("Order duplicated with all items");
      router.push(`/editor?id=${newQuote.id}`);
    } catch {
      toast.error("Failed to duplicate order");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold sm:text-3xl">Orders</h1>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          <span className="hidden sm:inline">New Order</span>
          <span className="sm:hidden">New</span>
        </Button>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search orders or items..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          <Button
            variant={statusFilter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter("all")}
          >
            All
          </Button>
          {QUOTE_STATUSES.map((s) => (
            <Button
              key={s}
              variant={statusFilter === s ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter(s)}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </Button>
          ))}
        </div>
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
              ? "No orders yet. Create your first one!"
              : "No orders match your search."}
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
                  <div className="flex shrink-0 gap-1.5">
                    <Badge className={`${STATUS_COLORS[quote.status as QuoteStatus] || STATUS_COLORS.draft} border-0`}>
                      {quote.status}
                    </Badge>
                    {quote.orderId && <Badge variant="outline">{quote.orderId}</Badge>}
                  </div>
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

      {/* Item search results */}
      {itemResults.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">
            Matching Items ({itemResults.length})
          </h2>
          <div className="overflow-hidden rounded-lg border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-3 py-2 text-left font-medium">Order</th>
                  <th className="px-3 py-2 text-left font-medium">Item</th>
                  <th className="px-3 py-2 text-left font-medium">Link</th>
                  <th className="px-3 py-2 text-left font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {itemResults.map(({ item, quote: q }) => (
                  <tr
                    key={item.id}
                    className={`border-b transition-colors hover:bg-muted/30 ${!item.include ? "opacity-50" : ""}`}
                  >
                    <td className="px-3 py-2">
                      <button
                        className="text-left hover:underline"
                        onClick={() => router.push(`/editor?id=${q.id}`)}
                      >
                        <div className="font-medium">{q.customerName}</div>
                        {q.orderId && (
                          <div className="text-xs text-muted-foreground">{q.orderId}</div>
                        )}
                      </button>
                    </td>
                    <td className="px-3 py-2 font-medium">{item.name}</td>
                    <td className="px-3 py-2">
                      <a
                        href={item.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-blue-600 hover:underline dark:text-blue-400"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <ExternalLink className="h-3 w-3" />
                        Link
                      </a>
                    </td>
                    <td className="px-3 py-2">
                      <Select
                        value={item.status || "none"}
                        onValueChange={(v) =>
                          handleUpdateItemStatus(item.id, v === "none" ? null : (v as ItemStatus))
                        }
                      >
                        <SelectTrigger className={`h-7 w-[110px] text-xs font-medium ${item.status ? ITEM_STATUS_COLORS[item.status] + " border-0" : ""}`}>
                          <SelectValue placeholder="--" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">--</SelectItem>
                          {ITEM_STATUSES.map((s) => (
                            <SelectItem key={s} value={s}>
                              {s.charAt(0).toUpperCase() + s.slice(1)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Order Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Order</DialogTitle>
            <DialogDescription>Create a new order for a customer.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {customers.length > 0 && (
              <div className="space-y-2">
                <Label>Customer</Label>
                <Select value={selectedCustomerId} onValueChange={handleSelectCustomer}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a customer..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">+ New Customer</SelectItem>
                    {customers.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}{c.discordHandle ? ` (${c.discordHandle})` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
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
            {selectedCustomerId === "new" && newCustomerName.trim() && (
              <div className="flex items-center gap-2">
                <Switch checked={saveAsCustomer} onCheckedChange={setSaveAsCustomer} />
                <Label className="text-sm text-muted-foreground">Save as returning customer</Label>
              </div>
            )}
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
            <DialogTitle>Delete Order</DialogTitle>
            <DialogDescription>
              This will permanently delete this order and all its items. This cannot be undone.
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
