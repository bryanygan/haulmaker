export type QuoteStatus = "draft" | "sent" | "paid" | "shipped" | "complete";

export const QUOTE_STATUSES: QuoteStatus[] = ["draft", "sent", "paid", "shipped", "complete"];

export const STATUS_COLORS: Record<QuoteStatus, string> = {
  draft:    "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  sent:     "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  paid:     "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  shipped:  "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300",
  complete: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
};

export interface Customer {
  id: string;
  name: string;
  discordHandle: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Quote {
  id: string;
  customerName: string;
  customerHandle: string | null;
  orderId: string | null;
  customerId: string | null;
  exchangeRate: number;
  fixedFeeUsd: number;
  shippingPerKgUsd: number;
  insuranceRate: number;
  haulFeeUsd: number;
  status: QuoteStatus;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  items: Item[];
}

export interface Item {
  id: string;
  quoteId: string;
  link: string;
  name: string;
  yuan: number;
  type: ItemType;
  weightGrams: number | null;
  include: boolean;
}

export type ItemType = "tee" | "hoodie" | "pants" | "shoes" | "accessory" | "custom";

export const ITEM_TYPES: ItemType[] = ["tee", "hoodie", "pants", "shoes", "accessory", "custom"];

export const DEFAULT_WEIGHTS: Record<ItemType, number> = {
  tee: 250,
  hoodie: 850,
  pants: 700,
  shoes: 1400,
  accessory: 300,
  custom: 0,
};

export interface QuoteTotals {
  itemCosts: { id: string; name: string; usd: number; included: boolean }[];
  totalItemCost: number;
  totalWeightKg: number;
  shipping: number;
  insurance: number;
  haulFee: number;
  grandTotal: number;
}

export interface CreateQuotePayload {
  customerName: string;
  customerHandle?: string;
  orderId?: string;
  customerId?: string;
}

export interface UpdateQuotePayload {
  customerName?: string;
  customerHandle?: string;
  orderId?: string;
  exchangeRate?: number;
  fixedFeeUsd?: number;
  shippingPerKgUsd?: number;
  insuranceRate?: number;
  haulFeeUsd?: number;
  status?: QuoteStatus;
  notes?: string;
}

export interface CreateItemPayload {
  link: string;
  name: string;
  yuan: number;
  type: ItemType;
  weightGrams?: number | null;
  include?: boolean;
}

export interface UpdateItemPayload {
  link?: string;
  name?: string;
  yuan?: number;
  type?: ItemType;
  weightGrams?: number | null;
  include?: boolean;
}
