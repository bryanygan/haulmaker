"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Item, ItemType, ItemStatus, ITEM_TYPES, ITEM_STATUSES, ITEM_STATUS_COLORS, DEFAULT_WEIGHTS, UpdateItemPayload } from "@/lib/types";
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
import { Trash2, ExternalLink, Sparkles, Loader2, GripVertical } from "lucide-react";
import { toast } from "sonner";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

export type ItemsViewMode = "table" | "cards";

interface ItemsTableProps {
  items: Item[];
  exchangeRate: number;
  fixedFeeUsd: number;
  onUpdateItem: (id: string, data: UpdateItemPayload) => Promise<void>;
  onDeleteItem: (id: string) => Promise<void>;
  onReorderItems: (items: Item[]) => void;
  viewMode: ItemsViewMode;
}

interface EditingCell {
  itemId: string;
  field: string;
}

// --- Sortable Card Item ---
function SortableCardItem({
  item,
  exchangeRate,
  fixedFeeUsd,
  onUpdateItem,
  onDeleteItem,
  editing,
  renderEditInput,
  startEdit,
  estimatingId,
  bulkEstimating,
  handleEstimateWeight,
}: {
  item: Item;
  exchangeRate: number;
  fixedFeeUsd: number;
  onUpdateItem: (id: string, data: UpdateItemPayload) => Promise<void>;
  onDeleteItem: (id: string) => Promise<void>;
  editing: EditingCell | null;
  renderEditInput: (item: Item, field: string, type?: string, className?: string, step?: string) => React.ReactNode;
  startEdit: (itemId: string, field: string, currentValue: string) => void;
  estimatingId: string | null;
  bulkEstimating: boolean;
  handleEstimateWeight: (item: Item) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
    position: isDragging ? "relative" as const : undefined,
  };

  const usd = computeItemUsd(item.yuan, exchangeRate, fixedFeeUsd);
  const weight = getItemWeight(item);
  const isDefault = item.weightGrams === null || item.weightGrams === undefined;
  const isEstimating = estimatingId === item.id;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`p-3 space-y-2 ${!item.include ? "opacity-50" : ""} ${item.status === "refunded" ? "bg-red-50/50 dark:bg-red-950/20" : ""} ${isDragging ? "bg-muted shadow-lg rounded-lg" : ""}`}
    >
      {/* Row 1: Drag Handle + Include + Name + Delete */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="cursor-grab touch-none text-muted-foreground hover:text-foreground shrink-0"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <Switch
          checked={item.include}
          onCheckedChange={(checked) => onUpdateItem(item.id, { include: checked })}
        />
        <div className="flex-1 min-w-0">
          {renderEditInput(item, "name") || (
            <span
              className="cursor-pointer rounded px-1 hover:bg-muted font-medium truncate block"
              onClick={() => startEdit(item.id, "name", item.name)}
            >
              {item.name}
            </span>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0"
          onClick={() => onDeleteItem(item.id)}
        >
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </div>

      {/* Row 2: Type + Status + Link */}
      <div className="flex items-center gap-2 flex-wrap">
        <Select
          value={item.type}
          onValueChange={(v) => onUpdateItem(item.id, { type: v as ItemType })}
        >
          <SelectTrigger className="h-7 w-24 text-xs">
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
        <Select
          value={item.status || "none"}
          onValueChange={(v) =>
            onUpdateItem(item.id, { status: v === "none" ? null : (v as ItemStatus) })
          }
        >
          <SelectTrigger className={`h-7 w-[100px] text-xs font-medium ${item.status ? ITEM_STATUS_COLORS[item.status] + " border-0" : ""}`}>
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
        <a
          href={item.link}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline dark:text-blue-400"
        >
          <ExternalLink className="h-3 w-3" />
          Link
        </a>
      </div>

      {/* Row 3: Yuan, USD, Weight */}
      <div className="flex items-center gap-3 text-sm">
        <div className="flex items-center gap-1">
          <span className="text-muted-foreground text-xs">Yuan:</span>
          {renderEditInput(item, "yuan", "number", "h-7 w-20 text-right text-xs", "0.01") || (
            <span
              className="cursor-pointer rounded px-1 hover:bg-muted"
              onClick={() => startEdit(item.id, "yuan", String(item.yuan))}
            >
              ¥{item.yuan.toFixed(2)}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <span className="text-muted-foreground text-xs">USD:</span>
          <span className="font-medium">${usd.toFixed(2)}</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-muted-foreground text-xs">Wt:</span>
          {renderEditInput(item, "weightGrams", "number", "h-7 w-16 text-right text-xs", "1") || (
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
            className="h-6 w-6 shrink-0"
            onClick={() => handleEstimateWeight(item)}
            disabled={isEstimating || bulkEstimating}
            title="AI weight estimate"
          >
            {isEstimating ? (
              <Loader2 className="h-3 w-3 animate-spin text-purple-500" />
            ) : (
              <Sparkles className="h-3 w-3 text-purple-500" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

// --- Sortable Table Row ---
function SortableTableRow({
  item,
  exchangeRate,
  fixedFeeUsd,
  onUpdateItem,
  onDeleteItem,
  editing,
  renderEditInput,
  startEdit,
  estimatingId,
  bulkEstimating,
  handleEstimateWeight,
}: {
  item: Item;
  exchangeRate: number;
  fixedFeeUsd: number;
  onUpdateItem: (id: string, data: UpdateItemPayload) => Promise<void>;
  onDeleteItem: (id: string) => Promise<void>;
  editing: EditingCell | null;
  renderEditInput: (item: Item, field: string, type?: string, className?: string, step?: string) => React.ReactNode;
  startEdit: (itemId: string, field: string, currentValue: string) => void;
  estimatingId: string | null;
  bulkEstimating: boolean;
  handleEstimateWeight: (item: Item) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
    position: isDragging ? "relative" as const : undefined,
  };

  const usd = computeItemUsd(item.yuan, exchangeRate, fixedFeeUsd);
  const weight = getItemWeight(item);
  const isDefault = item.weightGrams === null || item.weightGrams === undefined;
  const isEstimating = estimatingId === item.id;

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className={`border-b transition-colors hover:bg-muted/30 ${!item.include ? "opacity-50" : ""} ${item.status === "refunded" ? "bg-red-50/50 dark:bg-red-950/20" : ""} ${isDragging ? "bg-muted shadow-lg" : ""}`}
    >
      <td className="w-8 px-1 py-2">
        <button
          type="button"
          className="cursor-grab touch-none text-muted-foreground hover:text-foreground"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" />
        </button>
      </td>
      <td className="px-3 py-2">
        <Switch
          checked={item.include}
          onCheckedChange={(checked) => onUpdateItem(item.id, { include: checked })}
        />
      </td>
      <td className="px-3 py-2">
        {renderEditInput(item, "name") || (
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
        {renderEditInput(item, "yuan", "number", "h-8 w-24 text-right", "0.01") || (
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
          {renderEditInput(item, "weightGrams", "number", "h-8 w-20 text-right", "1") || (
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
            disabled={isEstimating || bulkEstimating}
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
        {renderEditInput(item, "link") || (
          <a
            href={item.link}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-blue-600 hover:underline dark:text-blue-400"
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
      <td className="px-3 py-2">
        <Select
          value={item.status || "none"}
          onValueChange={(v) =>
            onUpdateItem(item.id, { status: v === "none" ? null : (v as ItemStatus) })
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
}

// --- Main Component ---
export function ItemsTable({
  items,
  exchangeRate,
  fixedFeeUsd,
  onUpdateItem,
  onDeleteItem,
  onReorderItems,
  viewMode,
}: ItemsTableProps) {
  const [editing, setEditing] = useState<EditingCell | null>(null);
  const [editValue, setEditValue] = useState("");
  const [estimatingId, setEstimatingId] = useState<string | null>(null);
  const [bulkEstimating, setBulkEstimating] = useState(false);
  const [bulkProgress, setBulkProgress] = useState({ current: 0, total: 0 });
  const inputRef = useRef<HTMLInputElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

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

        const dot = result.confidence === "high" ? "🟢" : result.confidence === "medium" ? "🟡" : "🔴";
        const weightType = result.usedVolumetric ? "volumetric" : "actual";
        const details = [
          `Actual: ${result.actualWeightGrams}g`,
          result.volumetricWeightGrams ? `Volumetric: ${result.volumetricWeightGrams}g` : null,
          result.dimensions ? `Dims: ${result.dimensions}` : null,
          `Used: ${weightType} (higher)`,
        ].filter(Boolean).join(" | ");

        toast.success(
          `${dot} Estimated ${result.weightGrams}g (${result.confidence})`,
          { description: `${details}\n${result.reasoning}` }
        );
      } catch {
        toast.error("Failed to estimate weight");
      } finally {
        setEstimatingId(null);
      }
    },
    [onUpdateItem]
  );

  const handleBulkEstimate = useCallback(async () => {
    const itemsToEstimate = items.filter(
      (item) => item.include && (item.weightGrams === null || item.weightGrams === undefined)
    );

    if (itemsToEstimate.length === 0) {
      toast.info("All included items already have custom weights");
      return;
    }

    setBulkEstimating(true);
    setBulkProgress({ current: 0, total: itemsToEstimate.length });

    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < itemsToEstimate.length; i++) {
      const item = itemsToEstimate[i];
      setBulkProgress({ current: i + 1, total: itemsToEstimate.length });

      try {
        const result = await estimateWeight(item.name, item.type, item.link);
        await onUpdateItem(item.id, { weightGrams: result.weightGrams });
        successCount++;
      } catch {
        failCount++;
      }
    }

    setBulkEstimating(false);
    setBulkProgress({ current: 0, total: 0 });

    if (failCount === 0) {
      toast.success(`Estimated weights for ${successCount} items`);
    } else {
      toast.warning(`Estimated ${successCount} items, ${failCount} failed`);
    }
  }, [items, onUpdateItem]);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const oldIndex = items.findIndex((i) => i.id === active.id);
      const newIndex = items.findIndex((i) => i.id === over.id);
      if (oldIndex === -1 || newIndex === -1) return;

      const reordered = arrayMove(items, oldIndex, newIndex);
      onReorderItems(reordered);
    },
    [items, onReorderItems]
  );

  if (items.length === 0) {
    return (
      <div className="rounded-lg border p-8 text-center text-muted-foreground">
        No items yet. Add your first item above.
      </div>
    );
  }

  // Shared inline edit input renderer
  function renderEditInput(
    item: Item,
    field: string,
    type: string = "text",
    className: string = "h-8",
    step?: string
  ) {
    if (editing?.itemId !== item.id || editing.field !== field) return null;
    return (
      <Input
        ref={inputRef}
        type={type}
        step={step}
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={commitEdit}
        onKeyDown={(e) => {
          if (e.key === "Enter") commitEdit();
          if (e.key === "Escape") cancelEdit();
        }}
        className={className}
      />
    );
  }

  const itemIds = items.map((i) => i.id);

  return (
    <div className="rounded-lg border">
      {items.some((i) => i.include && (i.weightGrams === null || i.weightGrams === undefined)) && (
        <div className="flex items-center gap-2 border-b bg-muted/30 px-3 py-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleBulkEstimate}
            disabled={bulkEstimating}
          >
            {bulkEstimating ? (
              <>
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin text-purple-500" />
                Estimating {bulkProgress.current}/{bulkProgress.total}...
              </>
            ) : (
              <>
                <Sparkles className="mr-1.5 h-3.5 w-3.5 text-purple-500" />
                Estimate All Missing Weights
              </>
            )}
          </Button>
        </div>
      )}

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
          {/* Card layout */}
          <div className={viewMode === "cards" ? "divide-y" : "hidden"}>
            {items.map((item) => (
              <SortableCardItem
                key={item.id}
                item={item}
                exchangeRate={exchangeRate}
                fixedFeeUsd={fixedFeeUsd}
                onUpdateItem={onUpdateItem}
                onDeleteItem={onDeleteItem}
                editing={editing}
                renderEditInput={renderEditInput}
                startEdit={startEdit}
                estimatingId={estimatingId}
                bulkEstimating={bulkEstimating}
                handleEstimateWeight={handleEstimateWeight}
              />
            ))}
          </div>

          {/* Table layout */}
          <table className={viewMode === "table" ? "w-full text-sm" : "hidden"}>
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="w-8 px-1 py-2" />
                <th className="px-3 py-2 text-left font-medium">Include</th>
                <th className="px-3 py-2 text-left font-medium">Name</th>
                <th className="px-3 py-2 text-left font-medium">Type</th>
                <th className="px-3 py-2 text-right font-medium">Yuan</th>
                <th className="px-3 py-2 text-right font-medium">USD</th>
                <th className="px-3 py-2 text-right font-medium">Weight</th>
                <th className="px-3 py-2 text-left font-medium">Link</th>
                <th className="px-3 py-2 text-left font-medium">Status</th>
                <th className="px-3 py-2 text-center font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <SortableTableRow
                  key={item.id}
                  item={item}
                  exchangeRate={exchangeRate}
                  fixedFeeUsd={fixedFeeUsd}
                  onUpdateItem={onUpdateItem}
                  onDeleteItem={onDeleteItem}
                  editing={editing}
                  renderEditInput={renderEditInput}
                  startEdit={startEdit}
                  estimatingId={estimatingId}
                  bulkEstimating={bulkEstimating}
                  handleEstimateWeight={handleEstimateWeight}
                />
              ))}
            </tbody>
          </table>
        </SortableContext>
      </DndContext>

      <div className="px-3 py-2 text-xs text-muted-foreground">
        * = default weight from type. Click any value to edit inline.{" "}
        <Sparkles className="mb-0.5 inline h-3 w-3 text-purple-500" /> = AI weight estimate.
      </div>
    </div>
  );
}
