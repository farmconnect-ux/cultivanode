import type { JournalEntry, JournalPosting } from './types';

async function sha256Hex(str: string): Promise<string> {
  const enc = new TextEncoder();
  const buffer = await crypto.subtle.digest('SHA-256', enc.encode(str));
  const hashArray = Array.from(new Uint8Array(buffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export class CryptographicLedger {
  private entries: JournalEntry[] = [];
  private lastHash = '0'.repeat(64); // Genesis hash

  constructor(initialEntries: JournalEntry[] = []) {
    if (initialEntries.length > 0) {
      this.entries = [...initialEntries];
      this.lastHash = initialEntries[initialEntries.length - 1]!.currentHash;
    }
  }

  /**
   * Appends an immutable, double-entry balanced journal entry with SHA-256 hash chaining.
   * Throws if Debits != Credits or if any amount is non-positive.
   */
  async recordEntry(
    referenceId: string,
    description: string,
    postings: JournalPosting[],
    timestamp = Date.now()
  ): Promise<JournalEntry> {
    if (postings.length < 2) {
      throw new Error('A journal entry must contain at least 2 postings.');
    }

    let totalDebits = 0;
    let totalCredits = 0;

    for (const p of postings) {
      if (!Number.isSafeInteger(p.amountKobo) || p.amountKobo <= 0) {
        throw new Error(`Posting amount must be a positive integer kobo. Received: ${p.amountKobo}`);
      }
      if (p.direction === 'DEBIT') {
        totalDebits += p.amountKobo;
      } else if (p.direction === 'CREDIT') {
        totalCredits += p.amountKobo;
      } else {
        throw new Error(`Invalid posting direction: ${(p as any).direction}`);
      }
    }

    // Double-entry fundamental accounting invariant
    if (totalDebits !== totalCredits) {
      throw new Error(
        `UNBALANCED JOURNAL ENTRY: Sum of Debits (${totalDebits} kobo) must equal sum of Credits (${totalCredits} kobo).`
      );
    }

    const id = `jrn_${timestamp}_${Math.random().toString(36).slice(2, 8)}`;
    const postingsDigest = postings
      .map((p) => `${p.accountId}:${p.direction}:${p.amountKobo}`)
      .join('|');

    // SHA-256 hash chain: currentHash = SHA256(previousHash + id + referenceId + postingsDigest + timestamp)
    const payloadToHash = `${this.lastHash}:${id}:${referenceId}:${postingsDigest}:${timestamp}`;
    const currentHash = await sha256Hex(payloadToHash);

    const entry: JournalEntry = {
      id,
      referenceId,
      description,
      postings,
      timestamp,
      previousHash: this.lastHash,
      currentHash,
    };

    this.entries.push(entry);
    this.lastHash = currentHash;
    return entry;
  }

  getEntries(): JournalEntry[] {
    return [...this.entries];
  }

  /**
   * Verifies the entire cryptographic integrity of the ledger hash chain.
   */
  async verifyChainIntegrity(): Promise<{ valid: boolean; brokenAtEntryId?: string }> {
    let prev = '0'.repeat(64);

    for (const entry of this.entries) {
      if (entry.previousHash !== prev) {
        return { valid: false, brokenAtEntryId: entry.id };
      }

      const postingsDigest = entry.postings
        .map((p) => `${p.accountId}:${p.direction}:${p.amountKobo}`)
        .join('|');

      const expectedPayload = `${entry.previousHash}:${entry.id}:${entry.referenceId}:${postingsDigest}:${entry.timestamp}`;
      const calculatedHash = await sha256Hex(expectedPayload);

      if (entry.currentHash !== calculatedHash) {
        return { valid: false, brokenAtEntryId: entry.id };
      }

      prev = entry.currentHash;
    }

    return { valid: true };
  }

  /**
   * Computes the balance for a given account across all postings.
   * Assets/Expenses balance = Debits - Credits
   * Liabilities/Revenues balance = Credits - Debits
   */
  getAccountBalanceKobo(account: JournalPosting['accountId']): number {
    let debits = 0;
    let credits = 0;

    for (const entry of this.entries) {
      for (const p of entry.postings) {
        if (p.accountId === account) {
          if (p.direction === 'DEBIT') debits += p.amountKobo;
          if (p.direction === 'CREDIT') credits += p.amountKobo;
        }
      }
    }

    if (account.startsWith('ASSET') || account.startsWith('EXPENSE')) {
      return debits - credits;
    }
    return credits - debits;
  }
}
