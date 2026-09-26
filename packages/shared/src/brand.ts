// Central brand configuration. Renaming or restyling the product should only need changes here
// (plus app IDs in apps/mobile/app.config.ts and the icon SVGs, regenerated with `npm run brand:icons`).
//
// CultivaNode is the final name (decision 2026-09-26; domain, email and Instagram secured). The word mark
// is not yet registered: file with NIPO (classes 9 and 42, possibly 35) before calling it a trademark.
// Keep the capital N: CultivaNode, never Cultivanode or Cultiva Node.

export const brand = {
  name: 'CultivaNode',
  /** Master tagline. */
  tagline: 'Connected intelligence for agriculture',
  /** The human promise, kept from the first product. */
  promise: "Your farm's working partner",
  domain: 'cultivanode.com',
  /** Social handle (same on every platform where it could be secured). */
  handle: 'cultivanode',
  /**
   * Logo mark: a "C" whose ends and spine are connected nodes around a hub (farm, market, machine,
   * data). Plain shapes in a 40x40 box so the web, the app icon and the splash all draw the same mark.
   */
  logo: {
    viewBox: '0 0 40 40',
    background: '#123D27',
    shapes: [
      { kind: 'path', d: 'M13 20h7M28 12.2 20 20l8 7.8', stroke: '#3BC6D9', strokeWidth: 1.6, opacity: 0.9 },
      { kind: 'path', d: 'M28 12.2A11 11 0 1 0 28 27.8', stroke: '#FAF7F0', strokeWidth: 3.2 },
      { kind: 'circle', cx: 28, cy: 12.2, r: 2.9, fill: '#3BC6D9' },
      { kind: 'circle', cx: 28, cy: 27.8, r: 2.9, fill: '#3BC6D9' },
      { kind: 'circle', cx: 9, cy: 20, r: 2.9, fill: '#EFC150' },
      { kind: 'circle', cx: 20, cy: 20, r: 3.4, fill: '#78BB8A' },
    ],
  },
  primaryLanguage: 'en',
  /** Languages with complete translations. Pidgin, Igbo and Hausa are added as files later. */
  languages: ['en', 'yo'],
} as const;

export type Brand = typeof brand;
export type LogoShape = Brand['logo']['shapes'][number];

/** The logo mark as a standalone SVG string (for icons and places without React). */
export function logoSvg(opts: { rounded?: boolean; background?: boolean; scale?: number } = {}): string {
  const { rounded = true, background = true, scale = 1 } = opts;
  const l = brand.logo;
  const body = l.shapes
    .map((s) =>
      s.kind === 'circle'
        ? `<circle cx="${s.cx}" cy="${s.cy}" r="${s.r}" fill="${s.fill}"/>`
        : `<path d="${s.d}" fill="none" stroke="${s.stroke}" stroke-width="${s.strokeWidth}" stroke-linecap="round" stroke-linejoin="round"${'opacity' in s ? ` opacity="${s.opacity}"` : ''}/>`,
    )
    .join('');
  const bg = background ? `<rect width="40" height="40"${rounded ? ' rx="10"' : ''} fill="${l.background}"/>` : '';
  const inner = scale === 1 ? body : `<g transform="translate(20 20) scale(${scale}) translate(-20 -20)">${body}</g>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${l.viewBox}">${bg}${inner}</svg>`;
}
