import type {
  EscrowAccount,
  EscrowReleaseResult,
  EscrowRefundResult,
} from './types';
import { CryptographicLedger } from './cryptographic-ledger';
import { percentOfKobo } from '../../money';

const FORTY_EIGHT_HOURS_MS = 48 * 60 * 60 * 1000;

export class EscrowStateMachine {
  constructor(private ledger: CryptographicLedger) {}

  /**
   * Initializes and holds escrow funds from the farmer.
   */
  async holdFunds(
    escrowId: string,
    bookingId: string,
    farmerId: string,
    providerId: string,
    agreedPriceKobo: number,
    commissionRatePercent = 5
  ): Promise<{ escrow: EscrowAccount }> {
    // 1. Post to double-entry ledger: Debit Escrow Asset, Credit Farmer Deposit Liability
    await this.ledger.recordEntry(
      bookingId,
      `Escrow deposit held for booking ${bookingId}`,
      [
        {
          accountId: 'ASSET_ESCROW_HOLDING',
          direction: 'DEBIT',
          amountKobo: agreedPriceKobo,
          memo: `Funds held from farmer ${farmerId}`,
        },
        {
          accountId: 'LIABILITY_FARMER_DEPOSIT',
          direction: 'CREDIT',
          amountKobo: agreedPriceKobo,
          memo: `Farmer deposit liability for booking ${bookingId}`,
        },
      ]
    );

    const escrow: EscrowAccount = {
      escrowId,
      bookingId,
      farmerId,
      providerId,
      agreedPriceKobo,
      commissionRatePercent,
      status: 'HELD',
      heldAt: Date.now(),
    };

    return { escrow };
  }

  /**
   * Marks job work completed and starts the 48-hour auto-release clock.
   */
  markWorkCompleted(escrow: EscrowAccount): EscrowAccount {
    if (escrow.status !== 'HELD') {
      throw new Error(`Cannot mark work completed from status: ${escrow.status}`);
    }
    const now = Date.now();
    return {
      ...escrow,
      status: 'AWAITING_CONFIRMATION',
      autoReleaseDeadline: now + FORTY_EIGHT_HOURS_MS,
    };
  }

  /**
   * Freezes escrow funds due to an opened dispute.
   */
  freezeForDispute(escrow: EscrowAccount): EscrowAccount {
    if (escrow.status !== 'AWAITING_CONFIRMATION' && escrow.status !== 'HELD') {
      throw new Error(`Cannot freeze escrow from status: ${escrow.status}`);
    }
    return {
      ...escrow,
      status: 'DISPUTE_FROZEN',
    };
  }

  /**
   * Releases escrow funds to provider upon confirmation or 48-hour auto-release expiry.
   * Deducts platform commission in integer kobo.
   */
  async releaseFunds(escrow: EscrowAccount): Promise<EscrowReleaseResult> {
    if (escrow.status !== 'AWAITING_CONFIRMATION' && escrow.status !== 'HELD') {
      throw new Error(`Cannot release escrow from status: ${escrow.status}`);
    }

    const commissionKobo = percentOfKobo(escrow.agreedPriceKobo, escrow.commissionRatePercent);
    const providerPayoutKobo = escrow.agreedPriceKobo - commissionKobo;

    // Post to ledger:
    // Debit: LIABILITY_FARMER_DEPOSIT (full amount)
    // Credit: LIABILITY_PROVIDER_PAYABLE (net payout)
    // Credit: REVENUE_PLATFORM_COMMISSION (commission)
    const journalEntry = await this.ledger.recordEntry(
      escrow.bookingId,
      `Escrow settlement payout for booking ${escrow.bookingId}`,
      [
        {
          accountId: 'LIABILITY_FARMER_DEPOSIT',
          direction: 'DEBIT',
          amountKobo: escrow.agreedPriceKobo,
          memo: `Farmer deposit released`,
        },
        {
          accountId: 'LIABILITY_PROVIDER_PAYABLE',
          direction: 'CREDIT',
          amountKobo: providerPayoutKobo,
          memo: `Payable to provider ${escrow.providerId}`,
        },
        {
          accountId: 'REVENUE_PLATFORM_COMMISSION',
          direction: 'CREDIT',
          amountKobo: commissionKobo,
          memo: `Platform commission (${escrow.commissionRatePercent}%)`,
        },
      ]
    );

    escrow.status = 'SETTLED';
    escrow.settledAt = Date.now();

    return {
      escrowId: escrow.escrowId,
      providerPayoutKobo,
      platformCommissionKobo: commissionKobo,
      journalEntry,
    };
  }

  /**
   * Issues a full refund back to the farmer (e.g. cancelled or arbitrated no-show).
   */
  async refundFarmer(escrow: EscrowAccount): Promise<EscrowRefundResult> {
    // Post to ledger: Debit LIABILITY_FARMER_DEPOSIT, Credit ASSET_ESCROW_HOLDING
    const journalEntry = await this.ledger.recordEntry(
      escrow.bookingId,
      `Escrow refund to farmer for booking ${escrow.bookingId}`,
      [
        {
          accountId: 'LIABILITY_FARMER_DEPOSIT',
          direction: 'DEBIT',
          amountKobo: escrow.agreedPriceKobo,
          memo: `Farmer deposit refunded`,
        },
        {
          accountId: 'ASSET_ESCROW_HOLDING',
          direction: 'CREDIT',
          amountKobo: escrow.agreedPriceKobo,
          memo: `Escrow cash returned to farmer`,
        },
      ]
    );

    escrow.status = 'REFUNDED';
    escrow.settledAt = Date.now();

    return {
      escrowId: escrow.escrowId,
      refundFarmerKobo: escrow.agreedPriceKobo,
      journalEntry,
    };
  }
}
