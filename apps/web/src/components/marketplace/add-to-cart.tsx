"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Icon } from "@/components/ds/icon";
import { showScreenToast } from "@/components/ds/screen-dialog";
import { cart, type CartEntry } from "@/lib/cart";
import { cn } from "@/lib/utils";

/** Quantity stepper + "Add to cart" (and optional "Buy now", which goes straight to checkout). */
export function AddToCart({
  item,
  minQuantity = 1,
  lang,
  buyNow = false,
  compact = false,
  disabled = false,
}: {
  item: Omit<CartEntry, "quantity">;
  minQuantity?: number;
  lang: string;
  buyNow?: boolean;
  compact?: boolean;
  disabled?: boolean;
}) {
  const router = useRouter();
  const [qty, setQty] = useState(Math.max(1, minQuantity));
  const add = () => {
    cart.add({ ...item, quantity: qty });
    showScreenToast(`Added ${qty} ${item.unit} of ${item.title} to your cart.`);
  };
  const btn = "inline-flex items-center justify-center gap-1 rounded-lg px-3 py-2 font-label-md text-label-md transition-all active:scale-[0.98] disabled:opacity-50";
  return (
    <div className={cn("flex flex-wrap items-center gap-2", compact && "flex-nowrap")}>
      <label className="flex items-center gap-1 rounded-lg bg-surface-container-low px-2 py-1">
        <span className="sr-only">Quantity</span>
        <input
          type="number"
          min={minQuantity}
          step="any"
          value={qty}
          onChange={(e) => setQty(Math.max(0, Number(e.target.value)))}
          className="w-16 bg-transparent text-right text-body-md text-on-surface outline-none"
        />
        <span className="text-body-sm text-on-surface-variant">{item.unit}</span>
      </label>
      <button type="button" disabled={disabled || qty < minQuantity} onClick={add} className={cn(btn, "bg-surface-container-high text-on-surface hover:bg-surface-container-highest")}>
        <Icon name="add_shopping_cart" className="text-base" /> {compact ? "Add" : "Add to cart"}
      </button>
      {buyNow && (
        <button
          type="button"
          disabled={disabled || qty < minQuantity}
          onClick={() => {
            add();
            router.push(`/${lang}/marketplace/checkout`);
          }}
          className={cn(btn, "bg-primary-container text-on-primary hover:bg-primary")}
        >
          <Icon name="shopping_cart" className="text-base" /> Buy now
        </button>
      )}
    </div>
  );
}
