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

export function StatusBoard({ items, onUpdateItem }: StatusBoardProps) {
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

  return (
    <div className="flex gap-3 overflow-x-auto pb-2">
      {BOARD_COLUMNS.map(({ key, label }) => {
        const columnItems = grouped[key];
        return (
          <div
            key={key}
            className={`flex min-w-[180px] flex-1 flex-col rounded-lg border border-t-4 bg-muted/20 ${COLUMN_BORDER_COLORS[key]}`}
          >
            <div className="flex items-center justify-between px-3 py-2">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {label}
              </h3>
              <span className="text-xs text-muted-foreground">{columnItems.length}</span>
            </div>
            <div className="flex flex-1 flex-col gap-2 px-2 pb-2">
              {columnItems.length === 0 ? (
                <div className="rounded-md border border-dashed p-3 text-center text-xs text-muted-foreground">
                  No items
                </div>
              ) : (
                columnItems.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-md border bg-background p-2.5 shadow-sm"
                  >
                    <div className="mb-1.5 text-sm font-medium leading-snug">{item.name}</div>
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
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
