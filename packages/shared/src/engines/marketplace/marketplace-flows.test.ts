import { describe, expect, it } from 'vitest';
import {
  calculateOrderFees,
  groupCartBySeller,
  OrderStateMachine,
  MarketplaceInventoryEngine,
  MockPaymentAdapter,
  PaystackAdapter,
  FlutterwaveAdapter,
  FarmMarketplaceIntegration,
  BuyWhatINeedService,
  ProduceTraceabilityEngine,
  AIMarketplaceService,
  type MarketplaceCartItem,
  type InventoryLot,
  type OrderStatus,
  type FulfilmentStatus,
} from './index';

describe('Flow A: Farm-to-Market Comprehensive E2E Simulation', () => {
  it('executes full Flow A lifecycle from harvest batch to escrow release and farm books income', async () => {
    // 1. Farmer has harvested 50 bags of Yellow Maize (SAMMAZ 15)
    const harvestBatch = {
      farmId: 'farm-oy-01',
      farmName: 'Oyo Valley Farm',
      cropCycleId: 'cycle-mz-2026',
      batchCode: 'HARV-2026-MZ-01',
      harvestDate: '2026-10-01',
      quantityKg: 2500, // 50 x 50kg bags
      grade: 'grade_a',
      isOrganic: true,
    };

    // 2. Farmer lists 50 bags on Marketplace at N28,000 per bag (2,800,000 kobo)
    const listingId = 'lst-maize-01';
    const sellerId = 'seller-farmer-01';
    const lot: InventoryLot = {
      id: 'lot-mz-01',
      listingId,
      lotNumber: harvestBatch.batchCode,
      physicalQuantity: 50,
      reservedQuantity: 0,
      allocatedQuantity: 0,
      soldQuantity: 0,
    };

    // 3. Buyer places order for 20 bags
    const orderedQty = 20;
    const cartItems: MarketplaceCartItem[] = [
      {
        listingId,
        sellerId,
        sellerName: 'Oyo Valley Farm',
        title: 'Grade A Yellow Maize (50kg bag)',
        unit: 'bag',
        unitPriceKobo: 2800000, // N28,000
        quantity: orderedQty,
      },
    ];

    // Verify fee breakdown: 5% platform commission (500 bps), N7,500 delivery fee (750,000 kobo)
    const feeBreakdown = calculateOrderFees(cartItems, 500, 750000);
    const expectedSubtotal = 20 * 2800000; // 56,000,000 kobo (N560,000)
    const expectedCommission = Math.round((expectedSubtotal * 500) / 10000); // 2,800,000 kobo (N28,000)
    const expectedSellerNet = expectedSubtotal - expectedCommission; // 53,200,000 kobo (N532,000)
    const expectedTotalPayable = expectedSubtotal + 750000; // 56,750,000 kobo (N567,500)

    expect(feeBreakdown.itemsSubtotalKobo).toBe(expectedSubtotal);
    expect(feeBreakdown.commissionKobo).toBe(expectedCommission);
    expect(feeBreakdown.sellerEarningsKobo).toBe(expectedSellerNet);
    expect(feeBreakdown.deliveryFeeKobo).toBe(750000);
    expect(feeBreakdown.totalAmountKobo).toBe(expectedTotalPayable);

    // 4. Reserve inventory atomically
    const reservedLot = MarketplaceInventoryEngine.reserveQuantity(lot, orderedQty);
    expect(reservedLot.reservedQuantity).toBe(20);
    expect(MarketplaceInventoryEngine.getAvailableQuantity(reservedLot)).toBe(30);

    // 5. Order state progression: draft -> placed -> payment_pending
    expect(OrderStateMachine.canTransitionOrder('draft', 'placed')).toBe(true);
    expect(OrderStateMachine.canTransitionOrder('placed', 'payment_pending')).toBe(true);

    // 6. Payment processed via Mock Payment Gateway
    const paymentGateway = new MockPaymentAdapter();
    const paymentInit = await paymentGateway.initiatePayment('ord-flow-a', feeBreakdown.totalAmountKobo, 'buyer@lagosofftaker.com');
    expect(paymentInit.paymentReference).toBeDefined();

    const paymentVerification = await paymentGateway.verifyPayment(paymentInit.paymentReference);
    expect(paymentVerification.successful).toBe(true);
    expect(paymentVerification.amountKobo).toBe(feeBreakdown.totalAmountKobo);

    // 7. Order transitions to paid (held in escrow)
    expect(OrderStateMachine.canTransitionOrder('payment_pending', 'paid')).toBe(true);
    const orderStatusAfterPay: OrderStatus = 'paid';

    // 8. Seller fulfils and dispatches
    expect(OrderStateMachine.canTransitionFulfilment('placed', 'confirmed')).toBe(true);
    expect(OrderStateMachine.canTransitionFulfilment('confirmed', 'preparing')).toBe(true);
    expect(OrderStateMachine.canTransitionFulfilment('preparing', 'dispatched')).toBe(true);
    expect(OrderStateMachine.canTransitionFulfilment('dispatched', 'delivered')).toBe(true);
    expect(OrderStateMachine.canTransitionFulfilment('delivered', 'accepted')).toBe(true);

    // 9. Finalize inventory sale upon delivery
    const finalizedLot = MarketplaceInventoryEngine.finalizeSale(reservedLot, orderedQty);
    expect(finalizedLot.reservedQuantity).toBe(0);
    expect(finalizedLot.soldQuantity).toBe(20);
    expect(MarketplaceInventoryEngine.getAvailableQuantity(finalizedLot)).toBe(30);

    // 10. Escrow released to seller, netting platform commission
    const sellerPayoutKobo = feeBreakdown.sellerEarningsKobo;
    expect(sellerPayoutKobo).toBe(53200000);

    // 11. Farm Books automatically receives income entry
    const farmIncomePayload = FarmMarketplaceIntegration.formatProduceSaleIncome({
      farmId: harvestBatch.farmId,
      cropCycleId: harvestBatch.cropCycleId,
      amountKobo: sellerPayoutKobo,
      orderNumber: 'ORD-FLOW-A-001',
      itemTitle: 'Grade A Yellow Maize',
      quantity: orderedQty,
      unit: 'bag',
      payoutReference: 'ESCROW-REL-001',
      recordedBy: 'system-escrow',
    });

    expect(farmIncomePayload.type).toBe('income');
    expect(farmIncomePayload.category).toBe('harvest_sale');
    expect(farmIncomePayload.amount_kobo).toBe(53200000);
    expect(farmIncomePayload.farm_id).toBe('farm-oy-01');

    // 12. Traceability report validates farm origin for the buyer
    const provenance = ProduceTraceabilityEngine.buildTraceabilityReport({
      listingId,
      batchCode: harvestBatch.batchCode,
      farmId: harvestBatch.farmId,
      farmName: harvestBatch.farmName,
      farmState: 'Oyo',
      farmLga: 'Iseyin',
      cropId: 'yellow_maize',
      varietyId: 'sammaz_15',
      grade: harvestBatch.grade,
      isOrganic: harvestBatch.isOrganic,
    });

    expect(provenance.provenanceVerified).toBe(true);
    expect(provenance.farm?.name).toBe('Oyo Valley Farm');
  });
});

describe('Flow B: Market-to-Farm Inputs Comprehensive Simulation', () => {
  it('handles input procurement, escrow release, and automatic farm inventory update', () => {
    // 1. Agro-dealer listing: NPK 15-15-15 (50kg bag)
    const inputListing = {
      id: 'lst-npk-01',
      sellerId: 'dealer-ibadan-01',
      sellerName: 'AgroPro Supplies Ibadan',
      title: 'NPK 15-15-15 (50kg Bag)',
      unit: 'bag' as const,
      unitPriceKobo: 3800000, // N38,000 per bag
      availableQty: 100,
    };

    // 2. Farmer purchases 10 bags for planting
    const orderQty = 10;
    const cart: MarketplaceCartItem[] = [
      {
        listingId: inputListing.id,
        sellerId: inputListing.sellerId,
        sellerName: inputListing.sellerName,
        title: inputListing.title,
        unit: inputListing.unit,
        unitPriceKobo: inputListing.unitPriceKobo,
        quantity: orderQty,
      },
    ];

    const fees = calculateOrderFees(cart, 300, 500000); // 3% fee, N5,000 delivery
    expect(fees.itemsSubtotalKobo).toBe(38000000); // N380,000
    expect(fees.commissionKobo).toBe(1140000); // N11,400

    // 3. Delivery confirmed by farmer
    // Auto-generate Farm Inventory replenishment payload
    const farmInventoryPayload = FarmMarketplaceIntegration.formatInputInventoryReceipt({
      farmId: 'farm-oy-01',
      inputName: 'NPK 15-15-15 Fertiliser',
      category: 'fertilisers',
      quantityReceived: orderQty,
      unit: 'bag',
      unitCostKobo: inputListing.unitPriceKobo,
      orderNumber: 'ORD-FLOW-B-001',
      recordedBy: 'user-farmer-01',
    });

    expect(farmInventoryPayload.farm_id).toBe('farm-oy-01');
    expect(farmInventoryPayload.item_name).toBe('NPK 15-15-15 Fertiliser');
    expect(farmInventoryPayload.category).toBe('fertilisers');
    expect(farmInventoryPayload.quantity).toBe(10);
    expect(farmInventoryPayload.unit_cost_kobo).toBe(3800000);

    // 4. Auto-generate Farm Expense entry in farm books
    const farmExpensePayload = FarmMarketplaceIntegration.formatInputPurchaseExpense({
      farmId: 'farm-oy-01',
      amountKobo: fees.itemsSubtotalKobo,
      orderNumber: 'ORD-FLOW-B-001',
      itemTitle: 'NPK 15-15-15 Fertiliser',
      category: 'fertilisers',
      recordedBy: 'user-farmer-01',
    });

    expect(farmExpensePayload.type).toBe('expense');
    expect(farmExpensePayload.category).toBe('fertilisers');
    expect(farmExpensePayload.amount_kobo).toBe(38000000);
  });
});

describe('Flow C: Farm Services & Mechanization Simulation', () => {
  it('manages tractor tillage booking, escrow hold, and completion payout', () => {
    // 1. Machinery Provider listing: 75HP Tractor with 3-Disc Plough
    const serviceRateKobo = 4500000; // N45,000 per hectare
    const hectaresBooked = 4;
    const totalServiceCostKobo = serviceRateKobo * hectaresBooked; // N180,000 = 18,000,000 kobo

    const cart: MarketplaceCartItem[] = [
      {
        listingId: 'lst-tractor-01',
        sellerId: 'machinery-owner-01',
        sellerName: 'Oyo Agro-Mechanization Hub',
        title: '75HP 4WD Tractor Ploughing Service',
        unit: 'hectare',
        unitPriceKobo: serviceRateKobo,
        quantity: hectaresBooked,
      },
    ];

    const fees = calculateOrderFees(cart, 500, 0); // 5% fee, zero delivery (service on-site)
    expect(fees.itemsSubtotalKobo).toBe(18000000);
    expect(fees.commissionKobo).toBe(900000); // N9,000
    expect(fees.sellerEarningsKobo).toBe(17100000); // N171,000

    // 2. State machine tracks service lifecycle
    expect(OrderStateMachine.canTransitionFulfilment('placed', 'confirmed')).toBe(true);
    expect(OrderStateMachine.canTransitionFulfilment('confirmed', 'preparing')).toBe(true);
    expect(OrderStateMachine.canTransitionFulfilment('preparing', 'dispatched')).toBe(true); // Service en route
    expect(OrderStateMachine.canTransitionFulfilment('dispatched', 'delivered')).toBe(true); // Completed on field
    expect(OrderStateMachine.canTransitionFulfilment('delivered', 'accepted')).toBe(true);

    // 3. Farm Books records mechanization expense
    const farmExpense = FarmMarketplaceIntegration.formatInputPurchaseExpense({
      farmId: 'farm-oy-01',
      amountKobo: fees.totalAmountKobo,
      orderNumber: 'BOOK-TRACTOR-001',
      itemTitle: 'Tractor Disc Ploughing (4 Hectares)',
      category: 'machinery_hire',
      recordedBy: 'user-farmer-01',
    });

    expect(farmExpense.type).toBe('expense');
    expect(farmExpense.category).toBe('machinery_hire');
    expect(farmExpense.amount_kobo).toBe(18000000);
  });
});

describe('Inventory Concurrency & Zero Negative Stock', () => {
  it('strictly rejects race-condition reservations when inventory is insufficient', () => {
    const lot: InventoryLot = {
      id: 'lot-concurrency-01',
      listingId: 'lst-cassava-01',
      lotNumber: 'CAS-LOT-01',
      physicalQuantity: 15,
      reservedQuantity: 10,
      allocatedQuantity: 2,
      soldQuantity: 0,
    };

    // Available: 15 - 10 - 2 = 3
    expect(MarketplaceInventoryEngine.getAvailableQuantity(lot)).toBe(3);

    // Reservation of 3 succeeds
    const res1 = MarketplaceInventoryEngine.reserveQuantity(lot, 3);
    expect(res1.reservedQuantity).toBe(13);
    expect(MarketplaceInventoryEngine.getAvailableQuantity(res1)).toBe(0);

    // Subsequent reservation of even 1 unit throws INSUFFICIENT_STOCK
    expect(() => MarketplaceInventoryEngine.reserveQuantity(res1, 1)).toThrow(
      /INSUFFICIENT_STOCK/
    );
  });

  it('correctly handles reservation expiry release', () => {
    const lot: InventoryLot = {
      id: 'lot-expiry-01',
      listingId: 'lst-tomatoes-01',
      lotNumber: 'TOM-LOT-01',
      physicalQuantity: 50,
      reservedQuantity: 25,
      allocatedQuantity: 0,
      soldQuantity: 10,
    };

    // Buyer abandons checkout, reservation released
    const updated = MarketplaceInventoryEngine.releaseReservation(lot, 25);
    expect(updated.reservedQuantity).toBe(0);
    expect(MarketplaceInventoryEngine.getAvailableQuantity(updated)).toBe(50);
  });
});

describe('Dispute & Cancellation Workflow', () => {
  it('correctly manages dispute states and freezes fulfilment transitions', () => {
    const activeFulfilmentStatuses: FulfilmentStatus[] = ['dispatched'];
    expect(OrderStateMachine.canTransitionFulfilment('dispatched', 'disputed')).toBe(true);

    // Once disputed, fulfilment cannot transition directly to delivered or in_transit without dispute resolution
    expect(OrderStateMachine.canTransitionFulfilment('disputed', 'delivered')).toBe(false);
    expect(OrderStateMachine.canTransitionFulfilment('disputed', 'in_transit')).toBe(false);
    expect(OrderStateMachine.canTransitionFulfilment('disputed', 'preparing')).toBe(false);

    // Dispute resolved to cancelled (buyer refunded)
    expect(OrderStateMachine.canTransitionFulfilment('disputed', 'cancelled')).toBe(true);
  });

  it('handles multi-seller orders where one fulfilment is completed and one is disputed', () => {
    const compositeStatus = OrderStateMachine.deriveCompositeOrderStatus(['accepted', 'disputed']);
    expect(compositeStatus).toBe('disputed');
  });
});

describe('Agronomy Recommendation Engine: Multi-Crop Validation', () => {
  it('matches top-dressing fertilizer for maize at vegetative stage', () => {
    const candidates = [
      {
        id: 'lst-urea',
        sellerId: 's-1',
        sellerName: 'Fertilizer Hub',
        title: 'Granular Urea 46% N (50kg)',
        unit: 'bag',
        basePriceKobo: 4200000,
        availableQuantity: 40,
        distanceKm: 15,
        sellerRating: 4.8,
        isVerifiedSeller: true,
      },
      {
        id: 'lst-npk',
        sellerId: 's-2',
        sellerName: 'Farm Inputs Central',
        title: 'NPK 15-15-15',
        unit: 'bag',
        basePriceKobo: 3900000,
        availableQuantity: 20,
        distanceKm: 25,
        sellerRating: 4.5,
        isVerifiedSeller: true,
      },
    ];

    const results = BuyWhatINeedService.rankSuppliers(
      {
        farmId: 'f-1',
        operationName: 'Maize Top-Dressing at 5 Weeks',
        requiredInput: 'Urea',
        requiredQuantity: 10,
        unit: 'bag',
        maxDistanceKm: 50,
      },
      candidates
    );

    expect(results.length).toBe(1);
    expect(results[0]?.listingId).toBe('lst-urea');
  });
});
