// Central brand configuration. "Tillmate" is a WORKING NAME: it has not been cleared through CAC,
// NIPO, domain, app-store and social-handle checks, and a Caribbean POS app already uses the name.
// Renaming the product should only need changes here (plus app IDs in apps/mobile/app.config.ts).

export const brand = {
  name: 'Tillmate',
  tagline: "Your farm's working partner",
  /** Production domain once one is bought. Until then the Vercel URL is used. */
  domain: 'tillmate.vercel.app',
  /** Logo mark as SVG path data (viewBox 0 0 40 40), so web and mobile draw the same mark. */
  logo: {
    viewBox: '0 0 40 40',
    background: '#236639',
    stem: { d: 'M20 27V15', stroke: '#FAF7F0', strokeWidth: 2.6 },
    leafLeft: { d: 'M20 17c-1-5-5-7-9-6 0 5 4 7 9 6Z', fill: '#78BB8A' },
    leafRight: { d: 'M20 15c1-5 5-7 9-6 0 5-4 7-9 6Z', fill: '#EFC150' },
    furrows: { d: 'M8 29.5c4-2 20-2 24 0M9 33.5c4-1.6 18-1.6 22 0', stroke: '#EFC150', strokeWidth: 2 },
  },
  primaryLanguage: 'en',
  /** Languages with complete translations. Pidgin, Igbo and Hausa are added as files later. */
  languages: ['en', 'yo'],
  /** True until the name clears legal and availability checks. Never claim otherwise in the UI. */
  workingName: true,
} as const;

export type Brand = typeof brand;
