import { NextResponse } from 'next/server';
import { CryptographicLedger, type JournalPosting } from '@cultivanode/shared';
import { authorizeRequest } from '@/lib/engines-api-helper';

interface TransactRequestBody {
  referenceId: string;
  description: string;
  postings: JournalPosting[];
}

export async function POST(req: Request) {
  // Requires finance role or ledger permission
  const auth = await authorizeRequest(req, {
    requiredPermission: 'ledger.write',
  });
  if (!auth.authorized) return auth.response;

  try {
    const body = (await req.json()) as TransactRequestBody;
    const ledger = new CryptographicLedger();
    const entry = await ledger.recordEntry(body.referenceId, body.description, body.postings);
    return NextResponse.json(entry);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Invalid transaction';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
