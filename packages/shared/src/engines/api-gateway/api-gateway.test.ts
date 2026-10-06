import { describe, it, expect } from 'vitest';
import { authenticateStatelessRequest } from './middleware';
import { CultivaNodeEnginesClient } from './client';
import { signJwt } from '../auth-jwt/jwt';

describe('API Gateway Stateless Authentication Middleware', () => {
  const secret = 'engine-gateway-secret-2026';

  it('authenticates a request with valid Bearer JWT', async () => {
    const token = await signJwt(
      { sub: 'farmer_01', roles: ['crop_farmer'], tier: 2, permissions: ['farms.read'] },
      secret
    );

    const context = await authenticateStatelessRequest(`Bearer ${token}`, secret, {
      minimumTier: 1,
      requiredRole: 'crop_farmer',
    });

    expect(context.authenticated).toBe(true);
    expect(context.user?.sub).toBe('farmer_01');
    expect(context.user?.tier).toBe(2);
  });

  it('rejects request with missing or malformed header', async () => {
    const context = await authenticateStatelessRequest(null, secret);
    expect(context.authenticated).toBe(false);
    expect(context.statusCode).toBe(401);
  });

  it('rejects request when insufficient tier', async () => {
    const token = await signJwt({ sub: 'user_02', tier: 0 }, secret);
    const context = await authenticateStatelessRequest(`Bearer ${token}`, secret, {
      minimumTier: 2,
    });

    expect(context.authenticated).toBe(false);
    expect(context.statusCode).toBe(403);
    expect(context.error).toContain('Requires verification tier 2');
  });

  it('rejects request when missing required permission', async () => {
    const token = await signJwt({ sub: 'user_03', permissions: ['bookings.read'] }, secret);
    const context = await authenticateStatelessRequest(`Bearer ${token}`, secret, {
      requiredPermission: 'admin.manage',
    });

    expect(context.authenticated).toBe(false);
    expect(context.statusCode).toBe(403);
  });
});

describe('CultivaNode Engines Client (Modular In-Memory Execution)', () => {
  it('executes multiple decomposed engines through a single client interface', async () => {
    const client = new CultivaNodeEnginesClient({ mode: 'in_memory' });

    // 1. Cancellation engine
    const cancelRes = await client.evaluateCancellation({
      bookingId: 'b_1',
      actor: 'farmer',
      agreedPriceKobo: 4000000,
      jobDate: '2026-10-10',
      requestTimestamp: 1000,
      jobStartTimestamp: 1000 + 48 * 3600 * 1000,
      reason: 'Rain',
    });
    expect(cancelRes.allowed).toBe(true);
    expect(cancelRes.refundFarmerKobo).toBe(4000000);

    // 2. Agronomy Schedule engine
    const schedule = await client.generatePlantingSchedule({
      cropId: 'maize',
      varietyId: 'sammaz-15',
      farmAreaHectares: 3.0,
      plantingDate: '2026-04-20',
      zone: 'rainforest',
    });
    expect(schedule.operations.length).toBeGreaterThan(0);
    expect(schedule.harvestEstimatedDate).toBe('2026-08-03');

    // 3. Spray Planner engine
    const spray = await client.planSpray('mancozeb-80wp', 1.5, '2026-06-01', '2026-06-20');
    expect(spray.totalChemicalRequiredLitersOrKg).toBe(3.75);

    // 4. AI Guardrail engine
    const guardrail = client.checkAIGuardrails('Please apply Dithane M-45 for blight.');
    expect(guardrail.passed).toBe(true);
    expect(guardrail.sanitizedResponseText).toContain('Pre-Harvest Interval');
  });
});
