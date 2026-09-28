import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

// Yorùbá needs dots under ẹ ọ ṣ plus tone marks, sometimes stacked (ọ̀, Ẹ̀). A font that lacks a glyph
// makes the browser fall back mid-word, and some fonts drop tone marks on capitals (Inter did in Figma).
// This keeps every character of the website's Yorùbá text inside the unicode ranges of the brand font files.

const root = resolve(__dirname, '../../../..');
const req = createRequire(resolve(root, 'apps/web/package.json'));
const css = readFileSync(req.resolve('@fontsource-variable/plus-jakarta-sans/wght.css'), 'utf8');

const ranges = [...css.matchAll(/unicode-range:\s*([^;]+);/g)].flatMap((m) =>
  m[1]!.split(',').map((r) => {
    const [a, b] = r.trim().replace(/^U\+/i, '').split('-');
    return [parseInt(a!, 16), parseInt(b ?? a!, 16)] as const;
  }),
);
const covered = (cp: number) => ranges.some(([a, b]) => cp >= a && cp <= b);

// Letters and marks only: emoji and symbols come from the system emoji font on purpose.
const letters = (text: string) =>
  [...new Set([...text.normalize('NFC')].filter((c) => /[\p{L}\p{M}]/u.test(c)))];

describe('Yorùbá in the brand font', () => {
  it('covers the dot-below letters and tone marks, precomposed and combining', () => {
    const sample = 'Ẹ káàárọ̀ ọgbọ́n iṣẹ́ àgbẹ̀ ṣọ́ọ̀bù Ìbàdàn Òṣogbo Ẹ̀kìtì';
    for (const form of ['NFC', 'NFD'] as const) {
      const missing = [...sample.normalize(form)].filter((c) => /[\p{L}\p{M}]/u.test(c) && !covered(c.codePointAt(0)!));
      expect(missing, form).toEqual([]);
    }
  });

  it.each(['apps/web/src/i18n/dictionaries/yo.ts', 'apps/mobile/src/i18n/yo.ts'])('covers every letter in %s', (file) => {
    const text = readFileSync(resolve(root, file), 'utf8');
    const missing = letters(text).filter((c) => !covered(c.codePointAt(0)!));
    expect(missing).toEqual([]);
  });
});
