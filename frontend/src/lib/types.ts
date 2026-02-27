export interface Quote {
  id: string;
  customerName: string;
  customerHandle: string | null;
  orderId: string | null;
  exchangeRate: number;
  fixedFeeUsd: number;
  shippingPerKgUsd: number;
  insuranceRate: number;
  haulFeeUsd: number;
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
