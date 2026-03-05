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
  type DragEndEvent,
} from "@dnd-kit/core";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { useState } from "react";

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

function DraggableCard({
  item,
  onUpdateItem,
}: {
  item: Item;
  onUpdateItem: (id: string, data: UpdateItemPayload) => Promise<void>;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: item.id,
    data: { item },
  });
  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.3 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="cursor-grab touch-none rounded-md border bg-background p-2.5 shadow-sm active:cursor-grabbing"
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
}: {
  columnKey: string;
  label: string;
  items: Item[];
  onUpdateItem: (id: string, data: UpdateItemPayload) => Promise<void>;
  isOver: boolean;
}) {
  const { setNodeRef } = useDroppable({ id: columnKey });

  return (
    <div
      ref={setNodeRef}
      className={`flex min-w-[180px] flex-1 flex-col rounded-lg border border-t-4 transition-colors ${COLUMN_BORDER_COLORS[columnKey]} ${isOver ? "bg-muted/50 ring-2 ring-primary/20" : "bg-muted/20"}`}
    >
      <div className="flex items-center justify-between px-3 py-2">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {label}
        </h3>
        <span className="text-xs text-muted-foreground">{items.length}</span>
      </div>
      <div className="flex flex-1 flex-col gap-2 px-2 pb-2 min-h-[60px]">
        {items.length === 0 ? (
          <div className="rounded-md border border-dashed p-3 text-center text-xs text-muted-foreground">
            Drop here
          </div>
        ) : (
          items.map((item) => (
            <DraggableCard key={item.id} item={item} onUpdateItem={onUpdateItem} />
          ))
        )}
      </div>
    </div>
  );
}

export function StatusBoard({ items, onUpdateItem }: StatusBoardProps) {
  const [activeItem, setActiveItem] = useState<Item | null>(null);
  const [overColumn, setOverColumn] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const includedItems = items.filter((i) => i.include);

  const grouped: Record<string, Item[]> = { none: [] };
  for (const s of ITEM_STATUSES) grouped[s] = [];
  for (const item of includedItems) {
    grouped[item.status || "none"].push(item);
  }

  if (includedItems.length === 0) {
    return (
      <div className="rounded-lg border p-8 text-center text-muted-foreground">
        No included items to show.
      </div>
    );
  }

  function handleDragStart(event: DragStartEvent) {
    const item = event.active.data.current?.item as Item | undefined;
    setActiveItem(item || null);
  }

  function handleDragOver(event: { over: { id: string | number } | null }) {
    const overId = event.over?.id as string | null;
    // Check if hovering over a column
    const columnKeys = BOARD_COLUMNS.map((c) => c.key);
    if (overId && columnKeys.includes(overId as ItemStatus | "none")) {
      setOverColumn(overId);
    } else if (overId) {
      // Hovering over an item — find which column it's in
      const targetItem = includedItems.find((i) => i.id === overId);
      if (targetItem) {
        setOverColumn(targetItem.status || "none");
      }
    } else {
      setOverColumn(null);
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveItem(null);
    setOverColumn(null);

    const { active, over } = event;
    if (!over) return;

    const draggedItem = active.data.current?.item as Item | undefined;
    if (!draggedItem) return;

    const overId = over.id as string;
    const columnKeys = BOARD_COLUMNS.map((c) => c.key);

    let targetStatus: ItemStatus | null;
    if (columnKeys.includes(overId as ItemStatus | "none")) {
      // Dropped on a column
      targetStatus = overId === "none" ? null : (overId as ItemStatus);
    } else {
      // Dropped on an item — use that item's status
      const targetItem = includedItems.find((i) => i.id === overId);
      if (!targetItem) return;
      targetStatus = targetItem.status;
    }

    const currentStatus = draggedItem.status;
    if (targetStatus === currentStatus) return;

    onUpdateItem(draggedItem.id, { status: targetStatus });
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-3 overflow-x-auto pb-2">
        {BOARD_COLUMNS.map(({ key, label }) => (
          <DroppableColumn
            key={key}
            columnKey={key}
            label={label}
            items={grouped[key]}
            onUpdateItem={onUpdateItem}
            isOver={overColumn === key && activeItem?.status !== key && (key !== "none" || activeItem?.status !== null)}
          />
        ))}
      </div>
      <DragOverlay>
        {activeItem ? (
          <div className="rounded-md border bg-background p-2.5 shadow-lg w-[180px] opacity-90">
            <div className="text-sm font-medium leading-snug">{activeItem.name}</div>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
