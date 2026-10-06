import { describe, it, expect } from 'vitest';
import { CryptographicLedger } from './cryptographic-ledger';
import { EscrowStateMachine } from './escrow';

describe('Double-Entry Cryptographic Ledger', () => {
  it('records balanced journal entries and updates account balances', async () => {
    const ledger = new CryptographicLedger();

    // Farmer deposits ₦100,000 (10,000,000 kobo)
    await ledger.recordEntry('tx_01', 'Deposit 100k', [
      { accountId: 'ASSET_ESCROW_HOLDING', direction: 'DEBIT', amountKobo: 10000000, memo: 'deposit' },
      { accountId: 'LIABILITY_FARMER_DEPOSIT', direction: 'CREDIT', amountKobo: 10000000, memo: 'deposit liability' },
    ]);

    expect(ledger.getAccountBalanceKobo('ASSET_ESCROW_HOLDING')).toBe(10000000);
    expect(ledger.getAccountBalanceKobo('LIABILITY_FARMER_DEPOSIT')).toBe(10000000);

    // Verify cryptographic integrity
    const integrity = await ledger.verifyChainIntegrity();
    expect(integrity.valid).toBe(true);
  });

  it('rejects unbalanced journal entries (Debits != Credits)', async () => {
    const ledger = new CryptographicLedger();

    await expect(
      ledger.recordEntry('tx_bad', 'Unbalanced', [
        { accountId: 'ASSET_ESCROW_HOLDING', direction: 'DEBIT', amountKobo: 5000000, memo: 'd' },
        { accountId: 'LIABILITY_FARMER_DEPOSIT', direction: 'CREDIT', amountKobo: 4000000, memo: 'c' },
      ])
    ).rejects.toThrow('UNBALANCED JOURNAL ENTRY');
  });

  it('detects tampering in cryptographic hash chain', async () => {
    const ledger = new CryptographicLedger();

    await ledger.recordEntry('tx_1', 'Entry 1', [
      { accountId: 'ASSET_ESCROW_HOLDING', direction: 'DEBIT', amountKobo: 1000000, memo: 'm1' },
      { accountId: 'LIABILITY_FARMER_DEPOSIT', direction: 'CREDIT', amountKobo: 1000000, memo: 'm1' },
    ]);

    await ledger.recordEntry('tx_2', 'Entry 2', [
      { accountId: 'ASSET_ESCROW_HOLDING', direction: 'DEBIT', amountKobo: 2000000, memo: 'm2' },
      { accountId: 'LIABILITY_FARMER_DEPOSIT', direction: 'CREDIT', amountKobo: 2000000, memo: 'm2' },
    ]);

    // Initial chain is valid
    let check = await ledger.verifyChainIntegrity();
    expect(check.valid).toBe(true);

    // Maliciously tamper with first entry amount
    const entries = ledger.getEntries();
    entries[0]!.postings[0]!.amountKobo = 9999999;

    // Reconstruct ledger from tampered list
    const tamperedLedger = new CryptographicLedger(entries);
    check = await tamperedLedger.verifyChainIntegrity();
    expect(check.valid).toBe(false);
  });
});

describe('Escrow State Machine', () => {
  it('manages full lifecycle: hold, auto-release window, settlement with 5% commission', async () => {
    const ledger = new CryptographicLedger();
    const escrowEngine = new EscrowStateMachine(ledger);

    // 1. Hold ₦60,000 (6,000,000 kobo)
    const { escrow } = await escrowEngine.holdFunds(
      'esc_01',
      'book_01',
      'farmer_1',
      'provider_1',
      6000000,
      5 // 5% commission
    );

    expect(escrow.status).toBe('HELD');
    expect(ledger.getAccountBalanceKobo('ASSET_ESCROW_HOLDING')).toBe(6000000);

    // 2. Mark work completed
    const awaitingEscrow = escrowEngine.markWorkCompleted(escrow);
    expect(awaitingEscrow.status).toBe('AWAITING_CONFIRMATION');
    expect(awaitingEscrow.autoReleaseDeadline).toBeGreaterThan(Date.now());

    // 3. Release funds
    const release = await escrowEngine.releaseFunds(awaitingEscrow);
    expect(release.platformCommissionKobo).toBe(300000); // 5% of ₦60,000 = ₦3,000 (300,000 kobo)
    expect(release.providerPayoutKobo).toBe(5700000); // 95% = ₦57,000 (5,700,000 kobo)

    // Ledger balances verify
    expect(ledger.getAccountBalanceKobo('LIABILITY_FARMER_DEPOSIT')).toBe(0);
    expect(ledger.getAccountBalanceKobo('LIABILITY_PROVIDER_PAYABLE')).toBe(5700000);
    expect(ledger.getAccountBalanceKobo('REVENUE_PLATFORM_COMMISSION')).toBe(300000);

    const integrity = await ledger.verifyChainIntegrity();
    expect(integrity.valid).toBe(true);
  });

  it('freezes escrow funds when dispute is opened', async () => {
    const ledger = new CryptographicLedger();
    const escrowEngine = new EscrowStateMachine(ledger);

    const { escrow } = await escrowEngine.holdFunds('esc_02', 'book_02', 'f1', 'p1', 5000000);
    const awaiting = escrowEngine.markWorkCompleted(escrow);
    const frozen = escrowEngine.freezeForDispute(awaiting);

    expect(frozen.status).toBe('DISPUTE_FROZEN');
    // Cannot release frozen escrow directly
    await expect(escrowEngine.releaseFunds(frozen)).rejects.toThrow('Cannot release');
  });

  // M5 Master Plan Acceptance Gate: "At least 50 automated test bookings reconcile" (docs/PAYMENTS.md)
  it('reconciles at least 50 automated bookings through the double-entry hash-chained ledger', async () => {
    const ledger = new CryptographicLedger();
    const escrowEngine = new EscrowStateMachine(ledger);

    let totalGrossKobo = 0;
    let expectedTotalCommissionKobo = 0;
    let expectedTotalProviderPayoutKobo = 0;
    let expectedTotalRefundedKobo = 0;

    for (let i = 1; i <= 50; i++) {
      const priceKobo = 1000000 + i * 200000; // ₦10,000 to ₦110,000
      totalGrossKobo += priceKobo;

      const { escrow } = await escrowEngine.holdFunds(
        `esc_${i}`,
        `book_${i}`,
        `farmer_${i}`,
        `provider_${i % 5}`, // 5 distinct providers
        priceKobo,
        5 // 5% commission
      );

      if (i % 5 === 0) {
        // 10 bookings are cancelled and refunded to farmer
        await escrowEngine.refundFarmer(escrow);
        expectedTotalRefundedKobo += priceKobo;
      } else {
        // 40 bookings complete work and release funds
        const completed = escrowEngine.markWorkCompleted(escrow);
        const result = await escrowEngine.releaseFunds(completed);
        expectedTotalCommissionKobo += result.platformCommissionKobo;
        expectedTotalProviderPayoutKobo += result.providerPayoutKobo;
      }
    }

    // Double-entry accounting integrity assertions
    const holdingAsset = ledger.getAccountBalanceKobo('ASSET_ESCROW_HOLDING');
    const farmerDepositLiability = ledger.getAccountBalanceKobo('LIABILITY_FARMER_DEPOSIT');
    const providerPayableLiability = ledger.getAccountBalanceKobo('LIABILITY_PROVIDER_PAYABLE');
    const commissionRevenue = ledger.getAccountBalanceKobo('REVENUE_PLATFORM_COMMISSION');

    // 1. All farmer deposits must be fully cleared (0 remaining liability)
    expect(farmerDepositLiability).toBe(0);

    // 2. Net holding asset must equal provider payables + commission
    expect(holdingAsset).toBe(expectedTotalProviderPayoutKobo + expectedTotalCommissionKobo);

    // 3. Provider payables and commission revenue match calculated kobo sums
    expect(providerPayableLiability).toBe(expectedTotalProviderPayoutKobo);
    expect(commissionRevenue).toBe(expectedTotalCommissionKobo);

    // 4. Cryptographic SHA-256 hash chain verification across all 100+ transactions
    const chainIntegrity = await ledger.verifyChainIntegrity();
    expect(chainIntegrity.valid).toBe(true);
    expect(ledger.getEntries().length).toBe(100); // 50 holds + (40 releases + 10 refunds) = 100 entries
  });
});
