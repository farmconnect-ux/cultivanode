// =============================================================================
// CultivaNode Farm Intelligence: Security Cryptography Utilities
// =============================================================================

import { createHmac, createHash, timingSafeEqual } from 'node:crypto';

/**
 * Calculates SHA-256 hex hash of a raw string or token
 */
export function hashToken(token: string): string {
  return createHash('sha256').update(token.trim(), 'utf8').digest('hex');
}

/**
 * Computes HMAC-SHA256 signature over a payload using a shared device secret
 */
export function computeHmacSha256(payload: string, secretKey: string): string {
  return createHmac('sha256', secretKey).update(payload, 'utf8').digest('hex');
}

/**
 * Timing-safe comparison of two hex hashes or signatures to prevent timing attacks
 */
export function timingSafeCompare(known: string, candidate: string): boolean {
  if (!known || !candidate) return false;
  
  const knownBuffer = Buffer.from(known, 'utf8');
  const candidateBuffer = Buffer.from(candidate, 'utf8');

  if (knownBuffer.length !== candidateBuffer.length) {
    return false;
  }

  return timingSafeEqual(knownBuffer, candidateBuffer);
}

/**
 * Verifies that a received HMAC-SHA256 signature matches the calculated signature
 */
export function verifySignature(payload: string, candidateSignature: string, secretKey: string): boolean {
  const calculated = computeHmacSha256(payload, secretKey);
  return timingSafeCompare(calculated, candidateSignature);
}
