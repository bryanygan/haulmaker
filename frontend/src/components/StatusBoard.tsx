"use client";

import { Item, ItemStatus, ITEM_STATUSES, ITEM_STATUS_COLORS, UpdateItemPayload } from "@/lib/types";
import { ExternalLink } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DndContext,
  DragOverlay,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  type DragStartEvent,
  type DragOverEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  type AnimateLayoutChanges,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useState, useCallback } from "react";

const BOARD_COLUMNS: { key: ItemStatus | "none"; label: string }[] = [
  { key: "none", label: "No Status" },
  ...ITEM_STATUSES.map((s) => ({ key: s, label: s.charAt(0).toUpperCase() + s.slice(1) })),
];

const COLUMN_BORDER_COLORS: Record<string, string> = {
  none: "border-t-gray-400",
  ordered: "border-t-yellow-500",
  arrived: "border-t-green-500",
  returning: "border-t-orange-500",
  exchanging: "border-t-blue-500",
  refunded: "border-t-red-500",
};

interface StatusBoardProps {
  items: Item[];
  onUpdateItem: (id: string, data: UpdateItemPayload) => Promise<void>;
}

// Don't animate layout changes when an item is picked up or put down —
// this prevents the "snap back" glitch. Only animate normal reflows.
const animateLayoutChanges: AnimateLayoutChanges = ({ isSorting, wasDragging }) =>
  isSorting || wasDragging ? false : true;

function SortableCard({
  item,
  onUpdateItem,
  isDragOverlay,
}: {
  item: Item;
  onUpdateItem: (id: string, data: UpdateItemPayload) => Promise<void>;
  isDragOverlay?: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: item.id,
    data: { item, type: "card" },
    animateLayoutChanges,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    // Fully hide the original while dragging — the overlay represents it
    opacity: isDragging ? 0 : undefined,
  };

  if (isDragOverlay) {
    return (
      <div className="rounded-md border bg-background p-2.5 shadow-lg w-[180px] rotate-[2deg] scale-105">
        <div className="mb-1.5">
          <span className="text-sm font-medium leading-snug">{item.name}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className={`h-6 rounded px-2 text-xs font-medium flex items-center ${item.status ? ITEM_STATUS_COLORS[item.status] : "text-muted-foreground"}`}>
            {item.status ? item.status.charAt(0).toUpperCase() + item.status.slice(1) : "--"}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="cursor-grab touch-none rounded-md border bg-background p-2.5 shadow-sm transition-shadow hover:shadow-md active:cursor-grabbing"
      {...attributes}
      {...listeners}
    >
      <div className="mb-1.5">
        <span className="text-sm font-medium leading-snug">{item.name}</span>
      </div>
      <div className="flex items-center gap-2">
        <Select
          value={item.status || "none"}
          onValueChange={(v) =>
            onUpdateItem(item.id, { status: v === "none" ? null : (v as ItemStatus) })
          }
        >
          <SelectTrigger className={`h-6 w-[100px] text-xs font-medium ${item.status ? ITEM_STATUS_COLORS[item.status] + " border-0" : ""}`}>
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
          className="inline-flex items-center gap-0.5 text-xs text-blue-600 hover:underline dark:text-blue-400"
        >
          <ExternalLink className="h-3 w-3" />
        </a>
      </div>
    </div>
  );
}

function DroppableColumn({
  columnKey,
  label,
  items,
  onUpdateItem,
  isOver,
  activeId,
}: {
  columnKey: string;
  label: string;
  items: Item[];
  onUpdateItem: (id: string, data: UpdateItemPayload) => Promise<void>;
  isOver: boolean;
  activeId: string | null;
}) {
  const { setNodeRef } = useDroppable({ id: columnKey });
  const itemIds = items.map((i) => i.id);

  return (
    <div
      ref={setNodeRef}
      className={`flex min-w-[180px] flex-1 flex-col rounded-lg border border-t-4 transition-colors duration-200 ${COLUMN_BORDER_COLORS[columnKey]} ${isOver ? "bg-muted/50 ring-2 ring-primary/20" : "bg-muted/20"}`}
    >
      <div className="flex items-center justify-between px-3 py-2">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {label}
        </h3>
        <span className="text-xs text-muted-foreground">{items.length}</span>
      </div>
      <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
        <div className="flex flex-1 flex-col gap-2 px-2 pb-2 min-h-[60px]">
          {items.length === 0 ? (
            <div className="rounded-md border border-dashed p-3 text-center text-xs text-muted-foreground">
              Drop here
            </div>
          ) : (
            items.map((item) => (
              <SortableCard key={item.id} item={item} onUpdateItem={onUpdateItem} />
            ))
          )}
        </div>
      </SortableContext>
    </div>
  );
}

export function StatusBoard({ items, onUpdateItem }: StatusBoardProps) {
  const [activeItem, setActiveItem] = useState<Item | null>(null);
  const [overColumn, setOverColumn] = useState<string | null>(null);
  // Optimistic local status overrides during drag
  const [localOverrides, setLocalOverrides] = useState<Record<string, ItemStatus | null>>({});

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const includedItems = items.filter((i) => i.include);

  // Apply local overrides to get the "visual" status of each item
  const getEffectiveStatus = useCallback(
    (item: Item): ItemStatus | null => {
      if (item.id in localOverrides) return localOverrides[item.id];
      return item.status;
    },
    [localOverrides]
  );

  const grouped: Record<string, Item[]> = { none: [] };
  for (const s of ITEM_STATUSES) grouped[s] = [];
  for (const item of includedItems) {
    const status = getEffectiveStatus(item);
    grouped[status || "none"].push(item);
  }

  if (includedItems.length === 0) {
    return (
      <div className="rounded-lg border p-8 text-center text-muted-foreground">
        No included items to show.
      </div>
    );
  }

  function findColumnForItem(itemId: string): string | null {
    const item = includedItems.find((i) => i.id === itemId);
    if (!item) return null;
    return getEffectiveStatus(item) || "none";
  }

  function handleDragStart(event: DragStartEvent) {
    const item = event.active.data.current?.item as Item | undefined;
    setActiveItem(item || null);
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over) {
      setOverColumn(null);
      return;
    }

    const activeId = active.id as string;
    const overId = over.id as string;
    const columnKeys = BOARD_COLUMNS.map((c) => c.key);

    let targetColumn: string | null = null;

    if (columnKeys.includes(overId as ItemStatus | "none")) {
      // Hovering over a column directly
      targetColumn = overId;
    } else {
      // Hovering over another card — find its column
      const overItem = includedItems.find((i) => i.id === overId);
      if (overItem) {
        targetColumn = getEffectiveStatus(overItem) || "none";
      }
    }

    setOverColumn(targetColumn);

    // Optimistically move the card to the target column
    if (targetColumn !== null) {
      const currentColumn = findColumnForItem(activeId);
      if (currentColumn !== targetColumn) {
        const newStatus = targetColumn === "none" ? null : (targetColumn as ItemStatus);
        setLocalOverrides((prev) => ({ ...prev, [activeId]: newStatus }));
      }
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    const draggedItem = active.data.current?.item as Item | undefined;

    // Clear visual state
    setActiveItem(null);
    setOverColumn(null);

    // Determine final status
    if (!over || !draggedItem) {
      setLocalOverrides({});
      return;
    }

    const activeId = active.id as string;
    const finalStatus = localOverrides[activeId] !== undefined
      ? localOverrides[activeId]
      : draggedItem.status;

    // Clear overrides
    setLocalOverrides({});

    // Persist if status changed
    if (finalStatus !== draggedItem.status) {
      onUpdateItem(draggedItem.id, { status: finalStatus });
    }
  }

  function handleDragCancel() {
    setActiveItem(null);
    setOverColumn(null);
    setLocalOverrides({});
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="flex gap-3 overflow-x-auto pb-2">
        {BOARD_COLUMNS.map(({ key, label }) => (
          <DroppableColumn
            key={key}
            columnKey={key}
            label={label}
            items={grouped[key]}
            onUpdateItem={onUpdateItem}
            isOver={overColumn === key && activeItem != null && findColumnForItem(activeItem.id) !== key}
            activeId={activeItem?.id || null}
          />
        ))}
      </div>
      <DragOverlay dropAnimation={{
        duration: 200,
        easing: "cubic-bezier(0.25, 1, 0.5, 1)",
      }}>
        {activeItem ? (
          <SortableCard item={activeItem} onUpdateItem={onUpdateItem} isDragOverlay />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
