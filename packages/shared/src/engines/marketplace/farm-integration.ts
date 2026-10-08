export interface FarmIncomeEvent {
  farmId: string;
  cropCycleId?: string;
  amountKobo: number;
  orderNumber: string;
  itemTitle: string;
  quantity: number;
  unit: string;
  payoutReference: string;
  recordedBy: string;
}

export interface FarmExpenseEvent {
  farmId: string;
  amountKobo: number;
  orderNumber: string;
  itemTitle: string;
  category: 'fertilisers' | 'seeds' | 'chemicals' | 'machinery_service' | 'machinery_hire' | 'labour_wages' | 'services' | string;
  recordedBy: string;
}

export interface FarmInventorySyncEvent {
  farmId: string;
  itemName: string;
  category: 'seed' | 'fertiliser' | 'chemical' | 'feed' | 'tool_equipment' | 'harvest_produce' | string;
  quantity: number;
  unit: string;
  unitCostKobo: number;
}

export class FarmMarketplaceIntegration {
  /**
   * Formats a farm income record payload for insertion into farm_financial_transactions.
   */
  static formatProduceSaleIncome(event: FarmIncomeEvent) {
    return {
      farm_id: event.farmId,
      crop_cycle_id: event.cropCycleId ?? null,
      type: 'income' as const,
      category: 'harvest_sale' as const,
      amount_kobo: event.amountKobo,
      transaction_date: new Date().toISOString().split('T')[0],
      receipt_number: event.payoutReference,
      payment_method: 'escrow' as const,
      description: `Marketplace Sale: ${event.itemTitle} (${event.quantity} ${event.unit}) - Order ${event.orderNumber}`,
      recorded_by: event.recordedBy,
    };
  }

  /**
   * Formats a farm expense record payload for input or service purchases.
   */
  static formatInputPurchaseExpense(event: FarmExpenseEvent) {
    return {
      farm_id: event.farmId,
      type: 'expense' as const,
      category: event.category,
      amount_kobo: event.amountKobo,
      transaction_date: new Date().toISOString().split('T')[0],
      receipt_number: event.orderNumber,
      payment_method: 'escrow' as const,
      description: `Marketplace Purchase: ${event.itemTitle} - Order ${event.orderNumber}`,
      recorded_by: event.recordedBy,
    };
  }

  /**
   * Formats a farm inventory record payload upon receipt of delivered farm inputs.
   */
  static formatFarmInventoryReceipt(event: FarmInventorySyncEvent) {
    return {
      farm_id: event.farmId,
      item_name: event.itemName,
      category: event.category,
      quantity: event.quantity,
      unit: event.unit,
      unit_cost_kobo: event.unitCostKobo,
    };
  }

  /**
   * Alias for formatFarmInventoryReceipt supporting alternate event parameter naming.
   */
  static formatInputInventoryReceipt(event: {
    farmId: string;
    inputName: string;
    category: string;
    quantityReceived: number;
    unit: string;
    unitCostKobo: number;
    orderNumber: string;
    recordedBy: string;
  }) {
    return {
      farm_id: event.farmId,
      item_name: event.inputName,
      category: event.category,
      quantity: event.quantityReceived,
      unit: event.unit,
      unit_cost_kobo: event.unitCostKobo,
    };
  }
}
