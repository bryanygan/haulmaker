"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Item, ItemType, ITEM_TYPES, DEFAULT_WEIGHTS, UpdateItemPayload } from "@/lib/types";
import { computeItemUsd, getItemWeight } from "@/lib/calculations";
import { estimateWeight } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trash2, ExternalLink, Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface ItemsTableProps {
  items: Item[];
  exchangeRate: number;
  fixedFeeUsd: number;
  onUpdateItem: (id: string, data: UpdateItemPayload) => Promise<void>;
  onDeleteItem: (id: string) => Promise<void>;
}

interface EditingCell {
  itemId: string;
  field: string;
}

export function ItemsTable({
  items,
  exchangeRate,
  fixedFeeUsd,
  onUpdateItem,
  onDeleteItem,
}: ItemsTableProps) {
  const [editing, setEditing] = useState<EditingCell | null>(null);
  const [editValue, setEditValue] = useState("");
  const [estimatingId, setEstimatingId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  const startEdit = useCallback((itemId: string, field: string, currentValue: string) => {
    setEditing({ itemId, field });
    setEditValue(currentValue);
  }, []);

  const commitEdit = useCallback(async () => {
    if (!editing) return;
    const { itemId, field } = editing;
    setEditing(null);

    const item = items.find((i) => i.id === itemId);
    if (!item) return;

    const currentValue = String((item as unknown as Record<string, unknown>)[field] ?? "");
    if (editValue === currentValue) return;

    const data: UpdateItemPayload = {};
    if (field === "name") data.name = editValue;
    else if (field === "link") data.link = editValue;
    else if (field === "yuan") data.yuan = parseFloat(editValue) || 0;
    else if (field === "weightGrams") {
      data.weightGrams = editValue.trim() ? parseFloat(editValue) : null;
    }

    await onUpdateItem(itemId, data);
  }, [editing, editValue, items, onUpdateItem]);

  const cancelEdit = useCallback(() => {
    setEditing(null);
  }, []);

  const handleEstimateWeight = useCallback(
    async (item: Item) => {
      setEstimatingId(item.id);
      try {
        const result = await estimateWeight(item.name, item.type, item.link);
        await onUpdateItem(item.id, { weightGrams: result.weightGrams });

        const confidenceColor =
          result.confidence === "high" ? "green" : result.confidence === "medium" ? "yellow" : "red";
        const dot = confidenceColor === "green" ? "🟢" : confidenceColor === "yellow" ? "🟡" : "🔴";

        toast.success(
          `${dot} Estimated ${result.weightGrams}g (${result.confidence} confidence)`,
          { description: result.reasoning }
        );
      } catch {
        toast.error("Failed to estimate weight");
      } finally {
        setEstimatingId(null);
      }
    },
    [onUpdateItem]
  );

  if (items.length === 0) {
    return (
      <div className="rounded-lg border p-8 text-center text-muted-foreground">
        No items yet. Add your first item above.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="px-3 py-2 text-left font-medium">Include</th>
            <th className="px-3 py-2 text-left font-medium">Name</th>
            <th className="px-3 py-2 text-left font-medium">Type</th>
            <th className="px-3 py-2 text-right font-medium">Yuan</th>
            <th className="px-3 py-2 text-right font-medium">USD</th>
            <th className="px-3 py-2 text-right font-medium">Weight</th>
            <th className="px-3 py-2 text-left font-medium">Link</th>
            <th className="px-3 py-2 text-center font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => {
            const usd = computeItemUsd(item.yuan, exchangeRate, fixedFeeUsd);
            const weight = getItemWeight(item);
            const isDefault = item.weightGrams === null || item.weightGrams === undefined;
            const isEstimating = estimatingId === item.id;

            return (
              <tr
                key={item.id}
                className={`border-b transition-colors hover:bg-muted/30 ${!item.include ? "opacity-50" : ""}`}
              >
                <td className="px-3 py-2">
                  <Switch
                    checked={item.include}
                    onCheckedChange={(checked) => onUpdateItem(item.id, { include: checked })}
                  />
                </td>
                <td className="px-3 py-2">
                  {editing?.itemId === item.id && editing.field === "name" ? (
                    <Input
                      ref={inputRef}
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onBlur={commitEdit}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") commitEdit();
                        if (e.key === "Escape") cancelEdit();
                      }}
                      className="h-8"
                    />
                  ) : (
                    <span
                      className="cursor-pointer rounded px-1 hover:bg-muted"
                      onClick={() => startEdit(item.id, "name", item.name)}
                    >
                      {item.name}
                    </span>
                  )}
                </td>
                <td className="px-3 py-2">
                  <Select
                    value={item.type}
                    onValueChange={(v) => onUpdateItem(item.id, { type: v as ItemType })}
                  >
                    <SelectTrigger className="h-8 w-28">
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
                </td>
                <td className="px-3 py-2 text-right">
                  {editing?.itemId === item.id && editing.field === "yuan" ? (
                    <Input
                      ref={inputRef}
                      type="number"
                      step="0.01"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onBlur={commitEdit}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") commitEdit();
                        if (e.key === "Escape") cancelEdit();
                      }}
                      className="h-8 w-24 text-right"
                    />
                  ) : (
                    <span
                      className="cursor-pointer rounded px-1 hover:bg-muted"
                      onClick={() => startEdit(item.id, "yuan", String(item.yuan))}
                    >
                      ¥{item.yuan.toFixed(2)}
                    </span>
                  )}
                </td>
                <td className="px-3 py-2 text-right font-medium">${usd.toFixed(2)}</td>
                <td className="px-3 py-2 text-right">
                  <div className="flex items-center justify-end gap-1">
                    {editing?.itemId === item.id && editing.field === "weightGrams" ? (
                      <Input
                        ref={inputRef}
                        type="number"
                        step="1"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={commitEdit}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") commitEdit();
                          if (e.key === "Escape") cancelEdit();
                        }}
                        className="h-8 w-20 text-right"
                      />
                    ) : (
                      <span
                        className="cursor-pointer rounded px-1 hover:bg-muted"
                        onClick={() =>
                          startEdit(
                            item.id,
                            "weightGrams",
                            item.weightGrams !== null && item.weightGrams !== undefined
                              ? String(item.weightGrams)
                              : ""
                          )
                        }
                        title={isDefault ? `Default: ${DEFAULT_WEIGHTS[item.type as ItemType]}g` : "Custom weight"}
                      >
                        {weight}g{isDefault ? " *" : ""}
                      </span>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 shrink-0"
                      onClick={() => handleEstimateWeight(item)}
                      disabled={isEstimating}
                      title="AI weight estimate"
                    >
                      {isEstimating ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-purple-500" />
                      ) : (
                        <Sparkles className="h-3.5 w-3.5 text-purple-500" />
                      )}
                    </Button>
                  </div>
                </td>
                <td className="px-3 py-2">
                  {editing?.itemId === item.id && editing.field === "link" ? (
                    <Input
                      ref={inputRef}
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onBlur={commitEdit}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") commitEdit();
                        if (e.key === "Escape") cancelEdit();
                      }}
                      className="h-8"
                    />
                  ) : (
                    <a
                      href={item.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-blue-600 hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <ExternalLink className="h-3 w-3" />
                      <span
                        className="max-w-[120px] truncate"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          startEdit(item.id, "link", item.link);
                        }}
                      >
                        Link
                      </span>
                    </a>
                  )}
                </td>
                <td className="px-3 py-2 text-center">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => onDeleteItem(item.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <div className="px-3 py-2 text-xs text-muted-foreground">
        * = default weight from type. Click any value to edit inline.{" "}
        <Sparkles className="mb-0.5 inline h-3 w-3 text-purple-500" /> = AI weight estimate.
      </div>
    </div>
  );
}
