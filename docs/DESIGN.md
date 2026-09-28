# Design

Figma file: CultivaNode (key `NJrigbzm5n21AUx4S1Agbg`). Pages: **Brand** (brand board, Yorùbá diacritics check), **Screens** (mobile M1 flows, desktop landing, carousel note). Admin console screens: `docs/design/figma-admin-overview.js` builds them (not yet run, see below).

## Palette and type

Tokens live in `packages/shared/src/design/tokens.ts` and `apps/web/src/app/globals.css`: deep green (`leaf`), node cyan (`node`), graphite `ink`, off-white `cream`. On light backgrounds use `node-600` for cyan text; `node-300` only on deep green.

**Font: Plus Jakarta Sans everywhere (web and Figma).** Do not use Inter for Yorùbá text.

## Yorùbá diacritics

Yorùbá stacks a dot below (ẹ ọ ṣ) with a tone mark (ọ̀, Ẹ̀, Ọ́). Checked on 27 Sep 2026 at 44 px, both precomposed (NFC) and combining (NFD) text:

| Font | Result |
|---|---|
| Plus Jakarta Sans (Regular to ExtraBold) | All marks correct |
| Noto Sans | All marks correct |
| Inter (Figma) | Tone marks dropped or misplaced on capitals with a dot below: Ẹ̀ shows as Ẹ, Ọ́ loses its accent |

That is the render where "the dots were lost": the mobile greeting was set in Inter. All Screens text now uses Plus Jakarta Sans.

On the web, `@fontsource-variable/plus-jakarta-sans` ships the latin, latin-ext and vietnamese subsets; the vietnamese subset carries U+0300/0301/0323 and the precomposed dot-below letters. `packages/shared/src/__tests__/yoruba-font.test.ts` fails if any letter in the web or mobile Yorùbá dictionary falls outside the font's unicode ranges.

Keep Yorùbá text in NFC when you can (one code point per letter where Unicode has one); both forms render, but NFC is easier to search and compare.
