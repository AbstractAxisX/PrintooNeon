"use client";

/**
 * Customer-side order history, kept in localStorage.
 * The customer can review their past orders and their codes — the code is
 * what they show the shop ("this order is mine").
 */

export interface HistoryColor {
  id: string;
  name: string;
  /** tube hex, for the little dot swatch */
  tube: string;
}

export interface OrderHistoryEntry {
  code: string;
  text: string;
  fontName: string;
  modeName: string;
  /** tube style actually rendered — "single" | "double" (older entries: undefined) */
  lineMode?: "single" | "double";
  /** colors actually used, in order */
  colors: HistoryColor[];
  widthCm: number;
  /** ISO date */
  createdAt: string;
  /** tiny JPEG thumbnail (data URL) */
  thumb: string;
}

const KEY = "printoo-neon-orders";
const MAX_ENTRIES = 30;

export function getHistory(): OrderHistoryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return [];
    return arr.filter(
      (e): e is OrderHistoryEntry =>
        e && typeof e.code === "string" && typeof e.createdAt === "string"
    );
  } catch {
    return [];
  }
}

export function addOrder(entry: OrderHistoryEntry): void {
  if (typeof window === "undefined") return;
  try {
    const list = [entry, ...getHistory()].slice(0, MAX_ENTRIES);
    window.localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    // storage full (huge thumbs) — drop thumbs and retry once
    try {
      const list = [entry, ...getHistory().map((e) => ({ ...e, thumb: "" }))].slice(0, MAX_ENTRIES);
      window.localStorage.setItem(KEY, JSON.stringify(list));
    } catch {
      /* give up silently — ordering still worked */
    }
  }
}

export function clearHistory(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
