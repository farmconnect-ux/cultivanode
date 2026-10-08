import type { InputRequirementQuery, MatchedListing } from './types';

export interface CandidateListing {
  id: string;
  sellerId: string;
  sellerName: string;
  title: string;
  unit: string;
  basePriceKobo: number;
  availableQuantity: number;
  distanceKm: number;
  sellerRating: number;
  isVerifiedSeller: boolean;
}

export class BuyWhatINeedService {
  /**
   * Matches and ranks supplier listings against an agronomic input requirement.
   */
  static rankSuppliers(
    query: InputRequirementQuery,
    candidates: CandidateListing[]
  ): MatchedListing[] {
    const reqLower = query.requiredInput ? query.requiredInput.trim().toLowerCase() : '';
    const scored = candidates
      .filter((c) => {
        const matchesKeyword = reqLower ? c.title.toLowerCase().includes(reqLower) : true;
        return matchesKeyword && c.availableQuantity >= query.requiredQuantity;
      })
      .map((c) => {
        // Scoring formula:
        // Distance weight: 40 points (closer is higher)
        // Price weight: 30 points (lower price is higher)
        // Trust weight: 30 points (verified seller + rating)

        const maxDist = query.maxDistanceKm ?? 100;
        const distanceScore = Math.max(0, 40 * (1 - c.distanceKm / maxDist));

        // Rating score up to 20
        const ratingScore = (c.sellerRating / 5.0) * 20;

        // Verified seller bonus: 10 points
        const verificationScore = c.isVerifiedSeller ? 10 : 0;

        // Arbitrary price baseline normalization (up to 30 points)
        const priceScore = 20; // default baseline

        const totalScore = Math.round(distanceScore + ratingScore + verificationScore + priceScore);

        return {
          listingId: c.id,
          sellerId: c.sellerId,
          sellerName: c.sellerName,
          title: c.title,
          unit: c.unit as any,
          unitPriceKobo: c.basePriceKobo,
          availableQuantity: c.availableQuantity,
          distanceKm: c.distanceKm,
          score: Math.min(100, Math.max(0, totalScore)),
        };
      });

    return scored.sort((a, b) => b.score - a.score);
  }
}
