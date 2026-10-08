export interface AIMarketplaceQuery {
  category?: string;
  query?: string;
  location?: { lat: number; lng: number };
  maxRadiusKm?: number;
}

export interface AIMarketplaceListingSummary {
  id: string;
  title: string;
  priceNaira: string;
  unit: string;
  sellerName: string;
  distanceKm?: number;
}

export interface DraftListingProposal {
  title: string;
  listingType: 'produce' | 'input' | 'machinery' | 'labour' | 'service';
  unit: string;
  basePriceKobo: number;
  availableQuantity: number;
  requiresUserConfirmation: true;
}

export class AIMarketplaceService {
  /**
   * Safe read-only discovery interface for AI assistants to recommend listings to farmers.
   */
  static formatSearchSummary(
    listings: Array<{
      id: string;
      title: string;
      basePriceKobo: number;
      unit: string;
      sellerName: string;
      distanceKm?: number;
    }>
  ): AIMarketplaceListingSummary[] {
    return listings.map((l) => ({
      id: l.id,
      title: l.title,
      priceNaira: `₦${(l.basePriceKobo / 100).toLocaleString('en-NG')}`,
      unit: l.unit,
      sellerName: l.sellerName,
      distanceKm: l.distanceKm,
    }));
  }

  /**
   * Prepares a draft listing proposal initiated by AI.
   * AI CANNOT publish or modify financial balances directly; it only proposes drafts.
   */
  static proposeDraftListing(params: {
    title: string;
    listingType: 'produce' | 'input' | 'machinery' | 'labour' | 'service';
    unit: string;
    basePriceKobo: number;
    availableQuantity: number;
  }): DraftListingProposal {
    return {
      ...params,
      requiresUserConfirmation: true,
    };
  }
}
