import { NextResponse } from 'next/server';
import { authenticateStatelessRequest, type EngineAuthOptions } from '@cultivanode/shared';

export function getEngineSecret(): string {
  return (
    process.env.ENGINE_JWT_SECRET ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    'cultivanode-stateless-engine-secret-key-2026'
  );
}

export async function authorizeRequest(req: Request, options: EngineAuthOptions = {}) {
  const authHeader = req.headers.get('Authorization');
  const secret = getEngineSecret();

  const auth = await authenticateStatelessRequest(authHeader, secret, options);
  if (!auth.authenticated) {
    return {
      authorized: false,
      response: NextResponse.json(
        { error: auth.error ?? 'Unauthorized' },
        { status: auth.statusCode ?? 401 }
      ),
    };
  }

  return { authorized: true, user: auth.user! };
}
