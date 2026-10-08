import type {
  FarmInventoryItemLot,
  FarmInventoryTransactionType,
} from './types';

export interface FarmStockMovementRecord {
  id: string;
  farmId: string;
  itemId: string;
  fromLocationId?: string;
  toLocationId?: string;
  transactionType: FarmInventoryTransactionType;
  quantity: number;
  balanceBefore: number;
  balanceAfter: number;
  unitCostKobo: number;
  totalCostKobo: number;
  destinationEntityType?: string;
  destinationEntityId?: string;
  notes?: string;
  timestamp: number;
}

export class FarmMultiLocationInventoryEngine {
  private items: Map<string, FarmInventoryItemLot> = new Map();
  private transactions: FarmStockMovementRecord[] = [];

  constructor(initialItems: FarmInventoryItemLot[] = []) {
    for (const item of initialItems) {
      this.items.set(item.id, { ...item });
    }
  }

  getItem(id: string): FarmInventoryItemLot | undefined {
    const item = this.items.get(id);
    return item ? { ...item } : undefined;
  }

  getItemsByFarm(farmId: string): FarmInventoryItemLot[] {
    return Array.from(this.items.values())
      .filter((i) => i.farmId === farmId)
      .map((i) => ({ ...i }));
  }

  getAvailableQuantity(itemId: string): number {
    const item = this.items.get(itemId);
    if (!item) return 0;
    return Math.max(0, item.quantityOnHand - item.reservedQuantity);
  }

  /**
   * Executes a transactional stock movement strictly preventing negative stock.
   */
  recordMovement(params: {
    farmId: string;
    itemId: string;
    transactionType: FarmInventoryTransactionType;
    quantity: number;
    unitCostKobo?: number;
    fromLocationId?: string;
    toLocationId?: string;
    destinationEntityType?: string;
    destinationEntityId?: string;
    notes?: string;
  }): FarmStockMovementRecord {
    if (params.quantity <= 0) {
      throw new Error(`TRANSACTION_QUANTITY_INVALID: Quantity must be strictly greater than 0. Received: ${params.quantity}`);
    }

    const item = this.items.get(params.itemId);
    if (!item) {
      throw new Error(`INVENTORY_ITEM_NOT_FOUND: Item ${params.itemId} does not exist in farm ${params.farmId}.`);
    }

    const balanceBefore = item.quantityOnHand;
    let balanceAfter = balanceBefore;
    const unitCost = params.unitCostKobo ?? item.unitCostKobo;
    const totalCost = Math.round(params.quantity * unitCost);

    switch (params.transactionType) {
      case 'PURCHASE':
      case 'RECEIPT':
      case 'RETURN':
        balanceAfter = balanceBefore + params.quantity;
        item.quantityOnHand = balanceAfter;
        break;

      case 'ISSUE':
      case 'CONSUMPTION':
      case 'LOSS':
      case 'DAMAGE':
      case 'SALE':
        if (params.quantity > item.quantityOnHand) {
          throw new Error(
            `INSUFFICIENT_STOCK: Cannot issue/consume ${params.quantity} ${item.unit} of ${item.itemName}. Available on hand: ${item.quantityOnHand} ${item.unit}. Negative stock is strictly prohibited.`
          );
        }
        balanceAfter = balanceBefore - params.quantity;
        item.quantityOnHand = balanceAfter;
        // If there was reserved stock, clear up to consumed amount
        if (item.reservedQuantity > 0) {
          item.reservedQuantity = Math.max(0, item.reservedQuantity - params.quantity);
        }
        break;

      case 'RESERVATION':
        const availableToReserve = item.quantityOnHand - item.reservedQuantity;
        if (params.quantity > availableToReserve) {
          throw new Error(
            `INSUFFICIENT_AVAILABLE_STOCK: Cannot reserve ${params.quantity} ${item.unit}. Only ${availableToReserve} ${item.unit} is unreserved.`
          );
        }
        item.reservedQuantity += params.quantity;
        balanceAfter = balanceBefore;
        break;

      case 'RELEASE':
        item.reservedQuantity = Math.max(0, item.reservedQuantity - params.quantity);
        balanceAfter = balanceBefore;
        break;

      case 'TRANSFER':
        // Moving stock between physical locations on the farm
        if (params.quantity > item.quantityOnHand) {
          throw new Error(`INSUFFICIENT_STOCK: Cannot transfer ${params.quantity} ${item.unit}. Available: ${item.quantityOnHand}.`);
        }
        if (params.toLocationId) {
          item.locationId = params.toLocationId;
        }
        balanceAfter = balanceBefore;
        break;

      case 'ADJUSTMENT':
        // Direct count reconciliation
        balanceAfter = params.quantity;
        item.quantityOnHand = balanceAfter;
        break;

      default:
        throw new Error(`UNSUPPORTED_TRANSACTION_TYPE: "${params.transactionType}"`);
    }

    const tx: FarmStockMovementRecord = {
      id: `tx_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      farmId: params.farmId,
      itemId: params.itemId,
      fromLocationId: params.fromLocationId,
      toLocationId: params.toLocationId,
      transactionType: params.transactionType,
      quantity: params.quantity,
      balanceBefore,
      balanceAfter,
      unitCostKobo: unitCost,
      totalCostKobo: totalCost,
      destinationEntityType: params.destinationEntityType,
      destinationEntityId: params.destinationEntityId,
      notes: params.notes,
      timestamp: Date.now(),
    };

    this.transactions.push(tx);
    return tx;
  }

  getTransactions(farmId: string): FarmStockMovementRecord[] {
    return this.transactions.filter((tx) => tx.farmId === farmId);
  }
}
