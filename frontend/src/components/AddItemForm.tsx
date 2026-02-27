"use client";

import { useState } from "react";
import { CreateItemPayload, ITEM_TYPES, ItemType } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Sparkles, Loader2 } from "lucide-react";
import { estimateWeight } from "@/lib/api";
import { toast } from "sonner";

interface AddItemFormProps {
  onAdd: (item: CreateItemPayload) => Promise<void>;
}

export function AddItemForm({ onAdd }: AddItemFormProps) {
  const [link, setLink] = useState("");
  const [name, setName] = useState("");
  const [yuan, setYuan] = useState("");
  const [type, setType] = useState<ItemType>("tee");
  const [weightGrams, setWeightGrams] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [estimating, setEstimating] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!link.trim() || !name.trim() || !yuan.trim()) return;

    setSubmitting(true);
    try {
      await onAdd({
        link: link.trim(),
        name: name.trim(),
        yuan: parseFloat(yuan),
        type,
        weightGrams: weightGrams.trim() ? parseFloat(weightGrams) : undefined,
      });
      setLink("");
      setName("");
      setYuan("");
      setType("tee");
      setWeightGrams("");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-lg border p-4">
      <h3 className="font-semibold">Add Item</h3>
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2 space-y-1">
          <Label htmlFor="item-link">Link</Label>
          <Input
            id="item-link"
            value={link}
            onChange={(e) => setLink(e.target.value)}
            placeholder="https://..."
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="item-name">Name</Label>
          <Input
            id="item-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Item name"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="item-yuan">Yuan</Label>
          <Input
            id="item-yuan"
            type="number"
            step="0.01"
            min="0"
            value={yuan}
            onChange={(e) => setYuan(e.target.value)}
            placeholder="0.00"
          />
        </div>
        <div className="space-y-1">
          <Label>Type</Label>
          <Select value={type} onValueChange={(v) => setType(v as ItemType)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ITEM_TYPES.map((t) => (
                <SelectItem key={t} value={t}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="item-weight">Weight (g) <span className="text-muted-foreground">(optional)</span></Label>
          <div className="flex gap-1.5">
            <Input
              id="item-weight"
              type="number"
              step="1"
              min="0"
              value={weightGrams}
              onChange={(e) => setWeightGrams(e.target.value)}
              placeholder="Auto from type"
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="shrink-0"
              disabled={estimating || !name.trim()}
              title={!name.trim() ? "Enter a name first" : "AI weight estimate"}
              onClick={async () => {
                setEstimating(true);
                try {
                  const result = await estimateWeight(name.trim(), type, link.trim() || undefined);
                  setWeightGrams(String(result.weightGrams));
                  const dot = result.confidence === "high" ? "🟢" : result.confidence === "medium" ? "🟡" : "🔴";
                  toast.success(
                    `${dot} Estimated ${result.weightGrams}g (${result.confidence})`,
                    { description: result.reasoning }
                  );
                } catch {
                  toast.error("Failed to estimate weight");
                } finally {
                  setEstimating(false);
                }
              }}
            >
              {estimating ? (
                <Loader2 className="h-4 w-4 animate-spin text-purple-500" />
              ) : (
                <Sparkles className="h-4 w-4 text-purple-500" />
              )}
            </Button>
          </div>
        </div>
      </div>
      <Button type="submit" disabled={submitting || !link.trim() || !name.trim() || !yuan.trim()}>
        <Plus className="mr-2 h-4 w-4" />
        Add Item
      </Button>
    </form>
  );
}
