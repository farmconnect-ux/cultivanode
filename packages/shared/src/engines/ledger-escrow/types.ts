export type LedgerAccountType =
  | 'ASSET_ESCROW_HOLDING'
  | 'LIABILITY_FARMER_DEPOSIT'
  | 'LIABILITY_PROVIDER_PAYABLE'
  | 'REVENUE_PLATFORM_COMMISSION'
  | 'EXPENSE_GATEWAY_FEES';

export type PostingDirection = 'DEBIT' | 'CREDIT';

export interface JournalPosting {
  accountId: LedgerAccountType;
  direction: PostingDirection;
  amountKobo: number;
  memo: string;
}

export interface JournalEntry {
  id: string;
  referenceId: string; // e.g. bookingId or paymentTxRef
  description: string;
  postings: JournalPosting[];
  timestamp: number;
  previousHash: string;
  currentHash: string;
}

export type EscrowStatus =
  | 'INITIALIZED'
  | 'HELD'
  | 'WORK_COMPLETED'
  | 'AWAITING_CONFIRMATION'
  | 'DISPUTE_FROZEN'
  | 'SETTLED'
  | 'REFUNDED';

export interface EscrowAccount {
  escrowId: string;
  bookingId: string;
  farmerId: string;
  providerId: string;
  agreedPriceKobo: number;
  commissionRatePercent: number; // e.g. 5%
  status: EscrowStatus;
  heldAt?: number;
  autoReleaseDeadline?: number; // timestamp 48h after completion
  settledAt?: number;
}

export interface EscrowReleaseResult {
  escrowId: string;
  providerPayoutKobo: number;
  platformCommissionKobo: number;
  journalEntry: JournalEntry;
}

export interface EscrowRefundResult {
  escrowId: string;
  refundFarmerKobo: number;
  journalEntry: JournalEntry;
}
