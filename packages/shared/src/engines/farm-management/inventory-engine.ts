import { InventoryItemState, StockMovementRequest } from './types';

export class FarmInventoryEngine {
  /**
   * Evaluates stock movement and enforces Zero Negative Stock invariant
   */
  public static processMovement(
    item: InventoryItemState,
    movement: StockMovementRequest
  ): {
    updatedItem: InventoryItemState;
    unitCostMinor: number;
    totalMovementCostMinor: number;
  } {
    if (movement.quantity <= 0) {
      throw new Error(`Movement quantity must be positive. Received: ${movement.quantity}`);
    }

    const isOutward = ['usage_out', 'transfer_out'].includes(movement.movementType);
    const isInward = ['purchase_in', 'transfer_in', 'harvest_in'].includes(movement.movementType);

    if (isOutward) {
      const available = item.currentQuantity - item.reservedQuantity;
      if (movement.quantity > available) {
        throw new Error(
          `Insufficient stock: Zero Negative Stock invariant violated. ` +
          `Available: ${available} ${item.unit}, requested: ${movement.quantity} ${item.unit}`
        );
      }

      const updatedQty = Number((item.currentQuantity - movement.quantity).toFixed(4));
      const unitCost = item.averageCostMinor;
      const totalCost = Math.round(unitCost * movement.quantity);

      return {
        updatedItem: {
          ...item,
          currentQuantity: updatedQty,
        },
        unitCostMinor: unitCost,
        totalMovementCostMinor: totalCost,
      };
    }

    if (isInward) {
      const incomingCostMinor = movement.unitCostMinor ?? item.averageCostMinor;
      const currentValuation = item.currentQuantity * item.averageCostMinor;
      const incomingValuation = movement.quantity * incomingCostMinor;
      const newTotalQty = item.currentQuantity + movement.quantity;

      // Weighted Average Cost recalculation
      const newAverageCost = newTotalQty > 0
        ? Math.round((currentValuation + incomingValuation) / newTotalQty)
        : incomingCostMinor;

      return {
        updatedItem: {
          ...item,
          currentQuantity: Number(newTotalQty.toFixed(4)),
          averageCostMinor: newAverageCost,
          lotNumber: movement.lotNumber ?? item.lotNumber,
        },
        unitCostMinor: incomingCostMinor,
        totalMovementCostMinor: Math.round(incomingValuation),
      };
    }

    if (movement.movementType === 'adjustment') {
      // Reconciled inventory quantity
      const newQty = movement.quantity; // In adjustment, movement.quantity represents the physical count
      return {
        updatedItem: {
          ...item,
          currentQuantity: newQty,
        },
        unitCostMinor: item.averageCostMinor,
        totalMovementCostMinor: Math.round(Math.abs(newQty - item.currentQuantity) * item.averageCostMinor),
      };
    }

    throw new Error(`Unsupported movement type: ${movement.movementType}`);
  }

  /**
   * Checks for expired or near-expiry batches
   */
  public static checkExpiryStatus(item: InventoryItemState, thresholdDays: number = 30): {
    isExpired: boolean;
    isNearExpiry: boolean;
    daysRemaining: number | null;
  } {
    if (!item.expiryDate) {
      return { isExpired: false, isNearExpiry: false, daysRemaining: null };
    }

    const expiryTime = new Date(item.expiryDate).getTime();
    const nowTime = Date.now();
    const diffDays = Math.ceil((expiryTime - nowTime) / (1000 * 60 * 60 * 24));

    return {
      isExpired: diffDays <= 0,
      isNearExpiry: diffDays > 0 && diffDays <= thresholdDays,
      daysRemaining: diffDays,
    };
  }
}
