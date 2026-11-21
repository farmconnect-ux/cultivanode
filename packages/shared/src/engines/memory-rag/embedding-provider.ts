/**
 * Provider-neutral EmbeddingProvider abstraction (ADR-003, Batch 03.2 Section 6).
 *
 * - No undocumented dependency on any commercial embedding vendor.
 * - `UnconfiguredEmbeddingProvider` fails cleanly when no embedding provider is configured.
 * - `DeterministicTestEmbeddingProvider` provides deterministic 1536-dim unit-norm vectors
 *   for offline/CI testing without network calls.
 */

import type { EmbeddingProvider, EmbeddingResult } from './types';

export const EMBEDDING_DIMENSIONS = 1536;

export function formatPgVector(vector: readonly number[]): string {
  if (vector.length !== EMBEDDING_DIMENSIONS) {
    throw new Error(`Expected ${EMBEDDING_DIMENSIONS}-dimensional vector, received ${vector.length}.`);
  }
  return `[${vector.map((v) => (Number.isFinite(v) ? Number(v.toFixed(6)) : 0)).join(',')}]`;
}

export class UnconfiguredEmbeddingProvider implements EmbeddingProvider {
  readonly name = 'unconfigured';
  readonly model = 'none';
  readonly version = '0';
  readonly dimensions = EMBEDDING_DIMENSIONS;

  async embed(): Promise<EmbeddingResult> {
    return {
      ok: false,
      code: 'provider_not_configured',
      message: 'No live embedding provider is configured; falling back to structured retrieval.',
    };
  }
}

/**
 * Deterministic bag-of-trigrams hash projection onto 1536 dimensions (L2-normalised).
 * Strictly for deterministic testing and offline similarity verification — never
 * presented as a commercial neural embedding model.
 */
export class DeterministicTestEmbeddingProvider implements EmbeddingProvider {
  readonly name = 'deterministic-test';
  readonly model = 'deterministic-test-v1';
  readonly version = '1.0';
  readonly dimensions = EMBEDDING_DIMENSIONS;

  async embed(text: string): Promise<EmbeddingResult> {
    const cleaned = text.trim().toLowerCase();
    if (!cleaned) {
      return {
        ok: false,
        code: 'invalid_input',
        message: 'Cannot generate embedding for empty text.',
      };
    }

    const vec = new Array<number>(EMBEDDING_DIMENSIONS).fill(0);
    const tokens = cleaned.split(/\s+/).filter(Boolean);
    for (const token of tokens) {
      const padded = `_${token}_`;
      for (let i = 0; i <= padded.length - 3; i++) {
        const gram = padded.slice(i, i + 3);
        let hash = 2166136261;
        for (let j = 0; j < gram.length; j++) {
          hash ^= gram.charCodeAt(j);
          hash = Math.imul(hash, 16777619);
        }
        const idx = Math.abs(hash) % EMBEDDING_DIMENSIONS;
        const sign = (hash & 1) === 0 ? 1 : -1;
        vec[idx] = (vec[idx] ?? 0) + sign;
      }
    }

    let normSq = 0;
    for (const v of vec) normSq += v * v;
    const norm = Math.sqrt(normSq) || 1;
    const normalized = vec.map((v) => v / norm);

    return {
      ok: true,
      vector: normalized,
      model: this.model,
      version: this.version,
      dimensions: this.dimensions,
    };
  }
}
