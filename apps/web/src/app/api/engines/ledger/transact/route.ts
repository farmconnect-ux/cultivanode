import { NextResponse } from 'next/server';
import { z } from 'zod';
import { authorizeRequest, parseJsonBody } from '@/lib/engines-api-helper';
import { createServiceClient } from '@/lib/supabase/admin';

const PostingSchema = z.object({
  account_id: z.string().regex(/^[A-Z0-9_]{3,50}$/),
  direction: z.enum(['DEBIT', 'CREDIT']),
  amount_kobo: z.number().int().positive(),
  memo: z.string().max(300).optional(),
});

const TransactSchema = z.object({
  referenceId: z.string().min(1).max(100),
  referenceType: z.enum(['order_payment', 'escrow_release', 'refund', 'payout', 'adjustment']).default('adjustment'),
  description: z.string().min(3).max(500),
  postings: z.array(PostingSchema).min(2),
});

export async function POST(req: Request) {
  const auth = await authorizeRequest(req, {
    requiredPermission: 'ledger.write',
  });
  if (!auth.authorized) return auth.response;

  const parsed = await parseJsonBody(req, TransactSchema);
  if (!parsed.ok) return parsed.response;

  const { referenceId, referenceType, description, postings } = parsed.data;
  const debits = postings.filter((p) => p.direction === 'DEBIT').reduce((s, p) => s + p.amount_kobo, 0);
  const credits = postings.filter((p) => p.direction === 'CREDIT').reduce((s, p) => s + p.amount_kobo, 0);
  if (debits !== credits) {
    return NextResponse.json(
      { error: `Unbalanced journal entry: debits (${debits}) != credits (${credits}).` },
      { status: 400 },
    );
  }

  const admin = createServiceClient();
  if (!admin) {
    return NextResponse.json(
      { error: 'Ledger persistence service is not configured.' },
      { status: 503 },
    );
  }

  const { data: entryId, error } = await admin.rpc('record_marketplace_journal_entry', {
    p_reference_id: referenceId,
    p_reference_type: referenceType,
    p_description: description,
    p_postings: postings,
  });

  if (error) {
    return NextResponse.json({ error: error.message || 'Ledger entry failed.' }, { status: 400 });
  }

  return NextResponse.json({ ok: true, entryId, referenceId, referenceType });
}
