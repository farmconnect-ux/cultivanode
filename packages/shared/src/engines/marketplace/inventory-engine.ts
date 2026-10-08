export interface InventoryLot {
  id: string;
  listingId: string;
  lotNumber: string;
  physicalQuantity: number;
  reservedQuantity: number;
  allocatedQuantity: number;
  soldQuantity: number;
}

export class MarketplaceInventoryEngine {
  /**
   * Computes available quantity strictly ensuring no negative stock.
   */
  static getAvailableQuantity(lot: InventoryLot): number {
    const committed = lot.reservedQuantity + lot.allocatedQuantity;
    if (lot.physicalQuantity < committed) {
      throw new Error(
        `CONCURRENCY_INTEGRITY_VIOLATION: Lot ${lot.lotNumber} has physical ${lot.physicalQuantity} < committed ${committed}.`
      );
    }
    return lot.physicalQuantity - committed;
  }

  /**
   * Validates if a reservation can safely proceed without risking an oversell.
   */
  static reserveQuantity(lot: InventoryLot, requestedQuantity: number): InventoryLot {
    if (requestedQuantity <= 0) {
      throw new Error(`Reservation quantity must be greater than zero. Received: ${requestedQuantity}`);
    }

    const available = this.getAvailableQuantity(lot);
    if (requestedQuantity > available) {
      throw new Error(
        `INSUFFICIENT_STOCK: Cannot reserve ${requestedQuantity}. Available in lot ${lot.lotNumber}: ${available}.`
      );
    }

    return {
      ...lot,
      reservedQuantity: lot.reservedQuantity + requestedQuantity,
    };
  }

  /**
   * Finalizes reserved stock into sold stock upon payment clearance.
   */
  static finalizeSale(lot: InventoryLot, quantitySold: number): InventoryLot {
    if (quantitySold > lot.reservedQuantity) {
      throw new Error(
        `CANNOT_FINALIZE_SALE: Quantity sold (${quantitySold}) exceeds reserved quantity (${lot.reservedQuantity}).`
      );
    }

    return {
      ...lot,
      physicalQuantity: lot.physicalQuantity - quantitySold,
      reservedQuantity: lot.reservedQuantity - quantitySold,
      soldQuantity: lot.soldQuantity + quantitySold,
    };
  }

  /**
   * Releases previously held reservation back to available stock.
   */
  static releaseReservation(lot: InventoryLot, quantityToRelease: number): InventoryLot {
    const releaseAmount = Math.min(quantityToRelease, lot.reservedQuantity);
    return {
      ...lot,
      reservedQuantity: lot.reservedQuantity - releaseAmount,
    };
  }
}
