import type { InventoryItemLot, StockMovement } from './types';

export class FarmInventoryLedger {
  private lots: Map<string, InventoryItemLot> = new Map();
  private movements: StockMovement[] = [];

  constructor(initialLots: InventoryItemLot[] = []) {
    for (const lot of initialLots) {
      this.lots.set(lot.sku, { ...lot });
    }
  }

  getLots(): InventoryItemLot[] {
    return Array.from(this.lots.values()).map((l) => ({ ...l }));
  }

  getItemBySku(sku: string): InventoryItemLot | undefined {
    const item = this.lots.get(sku);
    return item ? { ...item } : undefined;
  }

  recordMovement(movement: Omit<StockMovement, 'id' | 'timestamp'>): StockMovement {
    const item = this.lots.get(movement.sku);
    if (!item && movement.movementType !== 'receive') {
      throw new Error(`Inventory item with SKU ${movement.sku} does not exist.`);
    }

    let currentQty = item ? item.quantityOnHand : 0;

    if (movement.movementType === 'receive') {
      currentQty += movement.quantity;
      if (item) {
        item.quantityOnHand = currentQty;
      } else {
        this.lots.set(movement.sku, {
          id: `lot_${movement.sku}`,
          sku: movement.sku,
          name: movement.notes ?? movement.sku,
          category: 'seed',
          unit: 'units',
          quantityOnHand: currentQty,
          costPerUnitKobo: movement.unitCostKobo,
        });
      }
    } else {
      // issue_to_field or damage_writeoff
      if (movement.quantity > currentQty) {
        throw new Error(
          `INSUFFICIENT STOCK: Cannot issue ${movement.quantity} units of ${movement.sku}. Available: ${currentQty}. Negative stock balances are strictly prohibited.`
        );
      }
      currentQty -= movement.quantity;
      item!.quantityOnHand = currentQty;
    }

    const recorded: StockMovement = {
      ...movement,
      id: `mov_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      timestamp: Date.now(),
    };
    this.movements.push(recorded);
    return recorded;
  }

  getMovements(): StockMovement[] {
    return [...this.movements];
  }
}
