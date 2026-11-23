/** Masks key-like tokens (sk-…, sb_…, AIza…, long hex/base64 runs) in provider error text before logging. */
export function redactProviderError(message: string): string {
  return message
    .replace(/\b(sk-[A-Za-z0-9_-]{2})[A-Za-z0-9_*.-]+/g, "$1…")
    .replace(/\b(sb_(?:secret|publishable)_)[A-Za-z0-9_-]+/g, "$1…")
    .replace(/\bAIza[0-9A-Za-z_-]+/g, "AIza…")
    .replace(/[A-Za-z0-9_-]{32,}/g, "…")
    .slice(0, 220);
}
