import {
  Quote,
  Item,
  CreateQuotePayload,
  UpdateQuotePayload,
  CreateItemPayload,
  UpdateItemPayload,
} from "./types";
import { getToken, clearToken } from "./auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      ...headers,
      ...(options?.headers as Record<string, string>),
    },
  });

  if (res.status === 401) {
    clearToken();
    window.location.href = "/login";
    throw new Error("Unauthorized");
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed: ${res.status}`);
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

// Auth
export async function login(password: string): Promise<{ token: string }> {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || "Login failed");
  }

  return res.json();
}

// Quotes
export async function getQuotes(): Promise<Quote[]> {
  return request<Quote[]>("/quotes");
}

export async function getQuote(id: string): Promise<Quote> {
  return request<Quote>(`/quotes/${id}`);
}

export async function createQuote(data: CreateQuotePayload): Promise<Quote> {
  return request<Quote>("/quotes", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateQuote(id: string, data: UpdateQuotePayload): Promise<Quote> {
  return request<Quote>(`/quotes/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteQuote(id: string): Promise<void> {
  return request<void>(`/quotes/${id}`, { method: "DELETE" });
}

export async function duplicateQuote(id: string): Promise<Quote> {
  return request<Quote>(`/quotes/${id}/duplicate`, { method: "POST" });
}

// Items
export async function createItem(quoteId: string, data: CreateItemPayload): Promise<Item> {
  return request<Item>(`/quotes/${quoteId}/items`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateItem(id: string, data: UpdateItemPayload): Promise<Item> {
  return request<Item>(`/items/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteItem(id: string): Promise<void> {
  return request<void>(`/items/${id}`, { method: "DELETE" });
}

// AI Weight Estimation
export interface WeightEstimate {
  weightGrams: number;
  actualWeightGrams: number;
  volumetricWeightGrams: number | null;
  dimensions: string | null;
  usedVolumetric: boolean;
  confidence: "low" | "medium" | "high";
  reasoning: string;
}

export async function estimateWeight(
  name: string,
  type: string,
  link?: string
): Promise<WeightEstimate> {
  return request<WeightEstimate>("/estimate-weight", {
    method: "POST",
    body: JSON.stringify({ name, type, link }),
  });
}
