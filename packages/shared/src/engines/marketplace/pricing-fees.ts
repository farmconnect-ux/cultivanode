import type { FeeBreakdown, MarketplaceCartItem } from './types';

/**
 * Calculates deterministic fee breakdown for an order.
 * All amounts are strictly positive integer kobo.
 *
 * @param items Array of cart line items
 * @param commissionBps Platform commission basis points (default 500 = 5%)
 * @param deliveryFeeKobo Optional flat or calculated delivery fee in kobo
 */
export function calculateOrderFees(
  items: MarketplaceCartItem[],
  commissionBps = 500,
  deliveryFeeKobo = 0
): FeeBreakdown {
  if (items.length === 0) {
    throw new Error('Cannot calculate fees for an empty cart.');
  }

  let itemsSubtotalKobo = 0;

  for (const item of items) {
    if (!Number.isSafeInteger(item.unitPriceKobo) || item.unitPriceKobo < 0) {
      throw new Error(`Unit price must be a non-negative integer kobo. Received: ${item.unitPriceKobo}`);
    }
    if (item.quantity <= 0) {
      throw new Error(`Quantity must be strictly positive. Received: ${item.quantity}`);
    }
    const lineSubtotal = Math.round(item.unitPriceKobo * item.quantity);
    itemsSubtotalKobo += lineSubtotal;
  }

  const commissionKobo = Math.round((itemsSubtotalKobo * commissionBps) / 10000);
  const sellerEarningsKobo = itemsSubtotalKobo - commissionKobo;
  const platformFeeKobo = 0; // included in commission or separate flat fee
  const totalAmountKobo = itemsSubtotalKobo + deliveryFeeKobo + platformFeeKobo;

  return {
    itemsSubtotalKobo,
    deliveryFeeKobo,
    platformFeeKobo,
    totalAmountKobo,
    commissionKobo,
    sellerEarningsKobo,
  };
}

/**
 * Groups items by seller for multi-seller checkout splitting.
 */
export function groupCartBySeller(items: MarketplaceCartItem[]): Map<string, MarketplaceCartItem[]> {
  const sellerMap = new Map<string, MarketplaceCartItem[]>();

  for (const item of items) {
    const list = sellerMap.get(item.sellerId) ?? [];
    list.push(item);
    sellerMap.set(item.sellerId, list);
  }

  return sellerMap;
}
