import { verifyJwt, type JwtPayload } from '../auth-jwt/jwt';

export interface AuthenticatedRequestContext {
  authenticated: boolean;
  user?: JwtPayload;
  error?: string;
  statusCode?: number;
}

export interface EngineAuthOptions {
  requiredPermission?: string;
  requiredRole?: string;
  minimumTier?: number;
}

/**
 * Validates a stateless JWT token from an HTTP Authorization header.
 * Designed for Next.js API Routes, Edge Functions, or Node.js microservices.
 */
export async function authenticateStatelessRequest(
  authHeader: string | null | undefined,
  secret: string,
  options: EngineAuthOptions = {}
): Promise<AuthenticatedRequestContext> {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return {
      authenticated: false,
      error: 'Missing or malformed Authorization header. Expected Bearer <token>',
      statusCode: 401,
    };
  }

  const token = authHeader.substring(7).trim();
  const verification = await verifyJwt(token, secret);

  if (!verification.valid || !verification.payload) {
    return {
      authenticated: false,
      error: `Authentication failed: ${verification.error ?? 'invalid_token'}`,
      statusCode: 401,
    };
  }

  const user = verification.payload;

  // 1. Permission check
  if (options.requiredPermission) {
    const permissions = user.permissions ?? [];
    if (!permissions.includes(options.requiredPermission) && !user.roles?.includes('super_admin')) {
      return {
        authenticated: false,
        error: `Forbidden: Missing required permission "${options.requiredPermission}"`,
        statusCode: 403,
      };
    }
  }

  // 2. Role check
  if (options.requiredRole) {
    const roles = user.roles ?? [];
    if (!roles.includes(options.requiredRole)) {
      return {
        authenticated: false,
        error: `Forbidden: Missing required role "${options.requiredRole}"`,
        statusCode: 403,
      };
    }
  }

  // 3. Verification tier check
  if (options.minimumTier !== undefined) {
    const userTier = user.tier ?? 0;
    if (userTier < options.minimumTier) {
      return {
        authenticated: false,
        error: `Forbidden: Requires verification tier ${options.minimumTier}. Current tier: ${userTier}`,
        statusCode: 403,
      };
    }
  }

  return {
    authenticated: true,
    user,
  };
}
