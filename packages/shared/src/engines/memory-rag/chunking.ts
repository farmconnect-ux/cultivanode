/**
 * Controlled agronomic standard document validation & chunking (Batch 03.2 Section 6).
 * Preserves section headings, page markers, paragraph indices, and SHA-256 content hashes.
 */

import {
  ALLOWED_AGRONOMIC_DOCUMENT_MIMES,
  type AgronomicDocumentChunkDraft,
  type AllowedAgronomicDocumentMime,
} from './types';

export const MAX_AGRONOMIC_DOCUMENT_BYTES = 10 * 1024 * 1024; // 10 MB
export const DEFAULT_MAX_CHUNK_CHARS = 1200;

const ALLOWED_MIME_SET = new Set<string>(ALLOWED_AGRONOMIC_DOCUMENT_MIMES);

/**
 * Pure JS SHA-256 fallback-free helper using Web Crypto / Node subtle crypto.
 */
export async function sha256Hex(input: string): Promise<string> {
  const bytes = new TextEncoder().encode(input);
  const digest = await globalThis.crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export function validateAgronomicDocumentMetadata(params: {
  mimeType: string;
  fileSizeBytes: number;
  textContent: string;
}): { ok: true; mimeType: AllowedAgronomicDocumentMime } | { ok: false; error: string } {
  if (!ALLOWED_MIME_SET.has(params.mimeType)) {
    return { ok: false, error: `Unsupported document MIME type: ${params.mimeType}.` };
  }
  if (!Number.isInteger(params.fileSizeBytes) || params.fileSizeBytes <= 0 || params.fileSizeBytes > MAX_AGRONOMIC_DOCUMENT_BYTES) {
    return { ok: false, error: `Document size must be between 1 byte and ${MAX_AGRONOMIC_DOCUMENT_BYTES} bytes.` };
  }
  if (!params.textContent || params.textContent.trim().length === 0) {
    return { ok: false, error: 'Document text content cannot be empty.' };
  }
  return { ok: true, mimeType: params.mimeType as AllowedAgronomicDocumentMime };
}

/**
 * Splits validated source document text into bounded chunks while preserving
 * Markdown/section headings (`# ...`), explicit page markers (`--- PAGE N ---`),
 * and paragraph indices.
 */
export async function chunkAgronomicDocument(
  rawText: string,
  options: { maxChunkChars?: number } = {},
): Promise<AgronomicDocumentChunkDraft[]> {
  const maxChars = Math.max(200, Math.min(options.maxChunkChars ?? DEFAULT_MAX_CHUNK_CHARS, 7500));
  const normalized = rawText.replace(/\r\n/g, '\n').trim();
  if (!normalized) return [];

  const blocks = normalized.split(/\n{2,}/).map((b) => b.trim()).filter(Boolean);
  let currentSection: string | null = null;
  let currentPage: number | null = 1;
  let paragraphIndex = 0;
  let chunkIndex = 0;

  const chunks: AgronomicDocumentChunkDraft[] = [];
  let buffer = '';
  let bufferSection: string | null = null;
  let bufferPage: number | null = 1;
  let bufferParagraph = 0;

  const flush = async () => {
    const content = buffer.trim();
    if (!content) return;
    chunks.push({
      chunkIndex,
      sectionRef: bufferSection,
      pageNumber: bufferPage,
      paragraphIndex: bufferParagraph,
      content,
      contentSha256: await sha256Hex(content),
    });
    chunkIndex += 1;
    buffer = '';
  };

  for (const block of blocks) {
    const pageMatch = block.match(/^---\s*PAGE\s+(\d+)\s*---$/i);
    if (pageMatch) {
      await flush();
      currentPage = Number(pageMatch[1]);
      continue;
    }

    const headingMatch = block.match(/^#{1,4}\s+(.+)$/);
    if (headingMatch) {
      await flush();
      currentSection = headingMatch[1]!.trim().slice(0, 200);
      continue;
    }

    if (buffer.length > 0 && buffer.length + block.length + 2 > maxChars) {
      await flush();
    }

    if (buffer.length === 0) {
      bufferSection = currentSection;
      bufferPage = currentPage;
      bufferParagraph = paragraphIndex;
    }

    // If a single block exceeds maxChars, split cleanly at sentence/character boundaries.
    if (block.length > maxChars) {
      await flush();
      for (let offset = 0; offset < block.length; offset += maxChars) {
        const slice = block.slice(offset, offset + maxChars).trim();
        if (!slice) continue;
        chunks.push({
          chunkIndex,
          sectionRef: currentSection,
          pageNumber: currentPage,
          paragraphIndex,
          content: slice,
          contentSha256: await sha256Hex(slice),
        });
        chunkIndex += 1;
      }
    } else {
      buffer = buffer ? `${buffer}\n\n${block}` : block;
    }

    paragraphIndex += 1;
  }

  await flush();
  return chunks;
}
