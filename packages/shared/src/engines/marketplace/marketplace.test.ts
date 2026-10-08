import { describe, expect, it } from 'vitest';
import {
  calculateOrderFees,
  groupCartBySeller,
  OrderStateMachine,
  MarketplaceInventoryEngine,
  MockPaymentAdapter,
  FarmMarketplaceIntegration,
  BuyWhatINeedService,
  ProduceTraceabilityEngine,
  AIMarketplaceService,
  type MarketplaceCartItem,
  type InventoryLot,
} from './index';

describe('Marketplace Pricing and Fees', () => {
  it('calculates deterministic order fees in whole integer kobo', () => {
    const items: MarketplaceCartItem[] = [
      {
        listingId: 'lst-1',
        sellerId: 'sel-1',
        sellerName: 'Oyo Maize Farm',
        title: 'Yellow Maize 50kg bag',
        unit: 'bag',
        unitPriceKobo: 2500000, // N25,000
        quantity: 10, // 10 bags = N250,000 = 25,000,000 kobo
      },
    ];

    const fees = calculateOrderFees(items, 500, 500000); // 5% commission, N5,000 delivery

    expect(fees.itemsSubtotalKobo).toBe(25000000);
    expect(fees.deliveryFeeKobo).toBe(500000);
    expect(fees.commissionKobo).toBe(1250000); // 5% of N250,000 = N12,500 = 1,250,000 kobo
    expect(fees.sellerEarningsKobo).toBe(23750000); // N237,500
    expect(fees.totalAmountKobo).toBe(25500000); // N255,000
  });

  it('correctly partitions multi-seller cart items by seller', () => {
    const items: MarketplaceCartItem[] = [
      {
        listingId: 'lst-1',
        sellerId: 'sel-A',
        sellerName: 'Seller A',
        title: 'Maize',
        unit: 'bag',
        unitPriceKobo: 2000000,
        quantity: 2,
      },
      {
        listingId: 'lst-2',
        sellerId: 'sel-B',
        sellerName: 'Seller B',
        title: 'Urea',
        unit: 'bag',
        unitPriceKobo: 1500000,
        quantity: 1,
      },
      {
        listingId: 'lst-3',
        sellerId: 'sel-A',
        sellerName: 'Seller A',
        title: 'Soybean',
        unit: 'bag',
        unitPriceKobo: 3000000,
        quantity: 1,
      },
    ];

    const grouped = groupCartBySeller(items);
    expect(grouped.size).toBe(2);
    expect(grouped.get('sel-A')?.length).toBe(2);
    expect(grouped.get('sel-B')?.length).toBe(1);
  });
});

describe('Order State Machine', () => {
  it('allows valid order state transitions', () => {
    expect(() => OrderStateMachine.validateOrderTransition('draft', 'placed')).not.toThrow();
    expect(() => OrderStateMachine.validateOrderTransition('placed', 'payment_pending')).not.toThrow();
    expect(() => OrderStateMachine.validateOrderTransition('payment_pending', 'paid')).not.toThrow();
    expect(() => OrderStateMachine.validateOrderTransition('paid', 'processing')).not.toThrow();
    expect(() => OrderStateMachine.validateOrderTransition('delivered', 'completed')).not.toThrow();
  });

  it('rejects prohibited or illegal state jumps', () => {
    expect(() => OrderStateMachine.validateOrderTransition('draft', 'paid')).toThrow(
      /ILLEGAL_ORDER_TRANSITION/
    );
    expect(() => OrderStateMachine.validateOrderTransition('completed', 'draft')).toThrow(
      /ILLEGAL_ORDER_TRANSITION/
    );
    expect(() => OrderStateMachine.validateOrderTransition('cancelled', 'paid')).toThrow(
      /ILLEGAL_ORDER_TRANSITION/
    );
  });

  it('derives composite order status from multi-seller fulfillments', () => {
    expect(OrderStateMachine.deriveCompositeOrderStatus(['accepted', 'accepted'])).toBe('completed');
    expect(OrderStateMachine.deriveCompositeOrderStatus(['delivered', 'delivered'])).toBe('delivered');
    expect(OrderStateMachine.deriveCompositeOrderStatus(['dispatched', 'confirmed'])).toBe('partially_fulfilled');
    expect(OrderStateMachine.deriveCompositeOrderStatus(['confirmed', 'disputed'])).toBe('disputed');
  });
});

describe('Marketplace Inventory Concurrency Engine', () => {
  const sampleLot: InventoryLot = {
    id: 'lot-1',
    listingId: 'lst-1',
    lotNumber: 'LOT-2026-001',
    physicalQuantity: 100,
    reservedQuantity: 20,
    allocatedQuantity: 10,
    soldQuantity: 50,
  };

  it('calculates available quantity correctly', () => {
    // 100 physical - 20 reserved - 10 allocated = 70 available
    expect(MarketplaceInventoryEngine.getAvailableQuantity(sampleLot)).toBe(70);
  });

  it('safely reserves available stock', () => {
    const updated = MarketplaceInventoryEngine.reserveQuantity(sampleLot, 30);
    expect(updated.reservedQuantity).toBe(50);
    expect(MarketplaceInventoryEngine.getAvailableQuantity(updated)).toBe(40);
  });

  it('prevents overselling when requested quantity exceeds available stock', () => {
    expect(() => MarketplaceInventoryEngine.reserveQuantity(sampleLot, 75)).toThrow(
      /INSUFFICIENT_STOCK/
    );
  });

  it('finalizes sale moving reserved quantity to sold quantity', () => {
    const finalized = MarketplaceInventoryEngine.finalizeSale(sampleLot, 15);
    expect(finalized.reservedQuantity).toBe(5);
    expect(finalized.soldQuantity).toBe(65);
  });

  it('releases reserved quantity on cancellation', () => {
    const released = MarketplaceInventoryEngine.releaseReservation(sampleLot, 20);
    expect(released.reservedQuantity).toBe(0);
    expect(MarketplaceInventoryEngine.getAvailableQuantity(released)).toBe(90);
  });
});

describe('Payment Gateway Abstraction', () => {
  it('initiates and verifies payments idempotently with MockPaymentAdapter', async () => {
    const adapter = new MockPaymentAdapter();
    const init = await adapter.initiatePayment('ord-123', 5000000, 'buyer@cultivanode.com');

    expect(init.paymentReference).toContain('MOCK_ord-123');
    expect(init.provider).toBe('test_adapter');

    const verify = await adapter.verifyPayment(init.paymentReference);
    expect(verify.successful).toBe(true);
    expect(verify.paymentReference).toBe(init.paymentReference);
  });
});

describe('Farm Books & Inventory Integration', () => {
  it('formats farm income transaction payload for produce sales', () => {
    const payload = FarmMarketplaceIntegration.formatProduceSaleIncome({
      farmId: 'farm-101',
      cropCycleId: 'cycle-202',
      amountKobo: 4500000,
      orderNumber: 'ORD-8899',
      itemTitle: 'Harvested Maize Batch A',
      quantity: 20,
      unit: 'bags',
      payoutReference: 'PAYOUT-2026-001',
      recordedBy: 'user-001',
    });

    expect(payload.farm_id).toBe('farm-101');
    expect(payload.type).toBe('income');
    expect(payload.category).toBe('harvest_sale');
    expect(payload.amount_kobo).toBe(4500000);
    expect(payload.receipt_number).toBe('PAYOUT-2026-001');
  });

  it('formats farm expense transaction payload for input purchases', () => {
    const payload = FarmMarketplaceIntegration.formatInputPurchaseExpense({
      farmId: 'farm-101',
      amountKobo: 1200000,
      orderNumber: 'ORD-9900',
      itemTitle: 'NPK 15-15-15 Fertiliser',
      category: 'fertilisers',
      recordedBy: 'user-001',
    });

    expect(payload.farm_id).toBe('farm-101');
    expect(payload.type).toBe('expense');
    expect(payload.category).toBe('fertilisers');
    expect(payload.amount_kobo).toBe(1200000);
  });
});

describe('Buy What I Need Agronomy Matching', () => {
  it('filters and ranks suppliers matching an agronomic requirement', () => {
    const query = {
      farmId: 'farm-1',
      operationName: 'Basal Fertiliser Application',
      requiredInput: 'NPK 15-15-15',
      requiredQuantity: 10,
      unit: 'bag' as const,
      maxDistanceKm: 50,
    };

    const candidates = [
      {
        id: 'lst-1',
        sellerId: 'sel-1',
        sellerName: 'Far Away Dealer',
        title: 'NPK 15-15-15',
        unit: 'bag',
        basePriceKobo: 2500000,
        availableQuantity: 50,
        distanceKm: 45,
        sellerRating: 4.0,
        isVerifiedSeller: false,
      },
      {
        id: 'lst-2',
        sellerId: 'sel-2',
        sellerName: 'Nearby Agro-Dealer',
        title: 'NPK 15-15-15',
        unit: 'bag',
        basePriceKobo: 2550000,
        availableQuantity: 20,
        distanceKm: 8,
        sellerRating: 4.8,
        isVerifiedSeller: true,
      },
      {
        id: 'lst-3',
        sellerId: 'sel-3',
        sellerName: 'Out of Stock Dealer',
        title: 'NPK 15-15-15',
        unit: 'bag',
        basePriceKobo: 2000000,
        availableQuantity: 5, // Insufficient (needs 10)
        distanceKm: 5,
        sellerRating: 5.0,
        isVerifiedSeller: true,
      },
    ];

    const results = BuyWhatINeedService.rankSuppliers(query, candidates);
    expect(results.length).toBe(2); // Out of stock candidate excluded
    expect(results[0]?.listingId).toBe('lst-2'); // Nearby + verified dealer ranks first
  });
});

describe('Produce Traceability Engine', () => {
  it('builds verified traceability report when linked to farm and batch', () => {
    const report = ProduceTraceabilityEngine.buildTraceabilityReport({
      listingId: 'lst-1',
      batchCode: 'HARV-2026-MAZ-01',
      farmId: 'farm-1',
      farmName: 'Iseyin Green Acres',
      farmState: 'Oyo',
      farmLga: 'Iseyin',
      cropId: 'yellow_maize',
      varietyId: 'sammaz_15',
      grade: 'grade_a',
      isOrganic: true,
      certifications: ['GlobalGAP'],
    });

    expect(report.provenanceVerified).toBe(true);
    expect(report.farm?.name).toBe('Iseyin Green Acres');
    expect(report.batchCode).toBe('HARV-2026-MAZ-01');
    expect(report.quality?.isOrganic).toBe(true);
  });
});

describe('AI Assistant Service Interface', () => {
  it('formats read-only listing summaries for AI responses', () => {
    const summaries = AIMarketplaceService.formatSearchSummary([
      {
        id: 'lst-1',
        title: 'White Yam Tubers',
        basePriceKobo: 450000,
        unit: 'piece',
        sellerName: 'Oyo Yam Farmers Co-op',
        distanceKm: 12.4,
      },
    ]);

    expect(summaries[0]?.priceNaira).toBe('₦4,500');
    expect(summaries[0]?.title).toBe('White Yam Tubers');
  });

  it('guarantees AI listing proposals require explicit user confirmation', () => {
    const proposal = AIMarketplaceService.proposeDraftListing({
      title: 'Cassava Tubers 10 Tonnes',
      listingType: 'produce',
      unit: 'tonne',
      basePriceKobo: 12000000,
      availableQuantity: 10,
    });

    expect(proposal.requiresUserConfirmation).toBe(true);
  });
});
