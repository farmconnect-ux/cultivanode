// CultivaNode Marketplace Domain Types & Schemas

export type MarketplaceUnit =
  | 'kg'
  | 'g'
  | 'tonne'
  | 'bag'
  | 'crate'
  | 'basket'
  | 'piece'
  | 'litre'
  | 'hectare'
  | 'hour'
  | 'day'
  | 'job';

export type MarketplaceListingType =
  | 'produce'
  | 'input'
  | 'machinery'
  | 'labour'
  | 'service';

export type PriceModel =
  | 'fixed'
  | 'negotiable'
  | 'per_unit'
  | 'tiered'
  | 'quotation';

export type SellerType =
  | 'farmer'
  | 'external_farmer'
  | 'agro_dealer'
  | 'machinery_owner'
  | 'labour_provider'
  | 'service_provider'
  | 'aggregator'
  | 'processor'
  | 'cooperative';

export type OrderStatus =
  | 'draft'
  | 'placed'
  | 'payment_pending'
  | 'paid'
  | 'processing'
  | 'partially_fulfilled'
  | 'fulfilled'
  | 'delivered'
  | 'completed'
  | 'cancelled'
  | 'disputed'
  | 'refunded';

export type FulfilmentStatus =
  | 'placed'
  | 'confirmed'
  | 'preparing'
  | 'ready_for_pickup'
  | 'dispatched'
  | 'in_transit'
  | 'delivered'
  | 'accepted'
  | 'rejected'
  | 'cancelled'
  | 'disputed';

export type MarketplaceEscrowStatus =
  | 'held'
  | 'awaiting_confirmation'
  | 'disputed'
  | 'released'
  | 'refunded';

export type PaymentProvider = 'paystack' | 'flutterwave' | 'direct_transfer' | 'test_adapter';

export interface FeeBreakdown {
  itemsSubtotalKobo: number;
  deliveryFeeKobo: number;
  platformFeeKobo: number;
  totalAmountKobo: number;
  commissionKobo: number;
  sellerEarningsKobo: number;
}

export interface MarketplaceCartItem {
  listingId: string;
  sellerId: string;
  sellerName: string;
  title: string;
  unit: MarketplaceUnit;
  unitPriceKobo: number;
  quantity: number;
  deliveryFeeKobo?: number;
  farmId?: string;
  cropCycleId?: string;
  harvestId?: string;
}

export interface MarketplaceOrderSummary {
  orderId: string;
  orderNumber: string;
  buyerId: string;
  status: OrderStatus;
  paymentStatus: 'pending' | 'paid' | 'escrowed' | 'released' | 'refunded' | 'failed';
  totalAmountKobo: number;
  itemsCount: number;
  fulfilmentsCount: number;
}

export interface InputRequirementQuery {
  farmId: string;
  operationName: string;
  requiredInput: string;
  requiredQuantity: number;
  unit: MarketplaceUnit;
  maxDistanceKm?: number;
  deadlineDate?: string;
}

export interface MatchedListing {
  listingId: string;
  sellerId: string;
  sellerName: string;
  title: string;
  unit: MarketplaceUnit;
  unitPriceKobo: number;
  availableQuantity: number;
  distanceKm: number;
  score: number; // 0 - 100 ranking score
}

export interface ProduceTraceabilityReport {
  listingId: string;
  batchCode?: string;
  farm?: {
    id: string;
    name: string;
    state: string;
    lga: string;
  };
  crop?: {
    cropId: string;
    varietyId: string;
    season: string;
    plantingDate: string;
    harvestDate: string;
  };
  quality?: {
    grade: string;
    moisturePct?: number;
    isOrganic: boolean;
    certifications: string[];
  };
  provenanceVerified: boolean;
}
