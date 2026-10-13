"use client";

// A small marketplace cart kept in the browser (localStorage). It stores only listing ids,
// quantities and display hints; the server re-prices everything at checkout.
import { useSyncExternalStore } from "react";

export type CartEntry = { listingId: string; quantity: number; title: string; unit: string; unitPriceKobo: number; sellerName?: string };

const KEY = "cultivanode.cart.v1";
const EVENT = "cultivanode-cart";
const EMPTY: CartEntry[] = [];
let cache: CartEntry[] | null = null;

function read(): CartEntry[] {
  if (cache) return cache;
  try {
    const raw = window.localStorage.getItem(KEY);
    const parsed = raw ? (JSON.parse(raw) as CartEntry[]) : [];
    cache = Array.isArray(parsed) ? parsed.filter((e) => e && typeof e.listingId === "string" && Number(e.quantity) > 0) : [];
  } catch {
    cache = [];
  }
  return cache;
}

function write(next: CartEntry[]) {
  cache = next;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // Storage unavailable (private mode): the cart still works for this page view.
  }
  window.dispatchEvent(new Event(EVENT));
}

export const cart = {
  add(entry: CartEntry) {
    const cur = read();
    const found = cur.find((e) => e.listingId === entry.listingId);
    write(found ? cur.map((e) => (e.listingId === entry.listingId ? { ...e, ...entry, quantity: e.quantity + entry.quantity } : e)) : [...cur, entry]);
  },
  setQuantity(listingId: string, quantity: number) {
    write(quantity > 0 ? read().map((e) => (e.listingId === listingId ? { ...e, quantity } : e)) : read().filter((e) => e.listingId !== listingId));
  },
  remove(listingId: string) {
    write(read().filter((e) => e.listingId !== listingId));
  },
  clear() {
    write([]);
  },
};

function subscribe(cb: () => void) {
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
      cache = null;
      cb();
    }
  };
  window.addEventListener(EVENT, cb);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(EVENT, cb);
    window.removeEventListener("storage", onStorage);
  };
}

export function useCart(): CartEntry[] {
  return useSyncExternalStore(subscribe, read, () => EMPTY);
}
