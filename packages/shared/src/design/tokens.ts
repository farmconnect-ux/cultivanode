// CultivaNode design tokens: the single source for colours, type, spacing and radii.
//
// Web: apps/web/src/app/globals.css mirrors these in its Tailwind `@theme` block
//      (src/__tests__/tokens.test.ts fails if the two drift apart).
// Mobile: import these objects directly.
//
// Design intent
// - Outdoor use on low-cost Android phones in bright sun: strong contrast, large tap targets,
//   body text never below 16px.
// - Farm palette: leaf green for actions, harvest gold for highlights, soil brown for accents,
//   warm cream background. All text colours below pass WCAG AA (4.5:1) on `cream` and `white`.

export const colors = {
  // Leaf green, deepened to the CultivaNode brand (800 = logo background #123D27): primary actions, text
  leaf: {
    50: '#EDF5EF',
    100: '#D3E7D8',
    200: '#A9CFB4',
    300: '#78BB8A',
    400: '#4A9867',
    500: '#2E7A4F',
    600: '#1F6340', // primary button
    700: '#1A5236',
    800: '#123D27', // brand deep green, hero and footer
    900: '#0B2718',
  },
  // Node cyan: the brand accent (connections, highlights on dark green). 300 is the logo cyan.
  // Use 600+ for text on light backgrounds; 300 only on dark green or as a fill with dark text.
  node: {
    50: '#E8F8FA',
    100: '#C5EEF3',
    200: '#8FDDE8',
    300: '#3BC6D9',
    400: '#22A9BD',
    500: '#17879A',
    600: '#126B7A',
    700: '#0F5561',
  },
  // Harvest gold: highlights, badges, focus accents (not for body text on light backgrounds)
  harvest: {
    50: '#FDF7E7',
    100: '#FAEBC2',
    200: '#F5D889',
    300: '#EFC150',
    400: '#E6A92A',
    500: '#C98A14',
    600: '#A06B0E',
    700: '#7A510C',
  },
  // Soil brown: secondary accents, illustrations
  soil: {
    100: '#EFE6DC',
    300: '#C3A58A',
    500: '#8A6546',
    700: '#5C4130',
    900: '#33241A',
  },
  // Neutrals (warm)
  ink: '#1E2528', // body text (brand graphite)
  muted: '#55605A', // secondary text
  line: '#DAD6CC', // borders
  cream: '#FAF7F0', // page background
  white: '#FFFFFF',
  // Status
  success: '#1F6340',
  warning: '#A06B0E',
  danger: '#B42318',
  info: '#1E5A8A',
} as const;

export const fontFamily = {
  sans: "'Plus Jakarta Sans Variable', 'Plus Jakarta Sans', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
} as const;

// Sizes in px. Mobile uses the numbers directly; web uses them as rem/16 in globals.css.
export const fontSize = {
  xs: 13,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
  '4xl': 36,
  '5xl': 48,
} as const;

export const lineHeight = {
  tight: 1.15,
  snug: 1.3,
  normal: 1.5,
} as const;

export const fontWeight = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  extrabold: '800',
} as const;

// 4px grid
export const space = {
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
  16: 64,
  20: 80,
} as const;

export const radius = {
  sm: 6,
  md: 10,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;

// Minimum touch target (Android guideline is 48dp).
export const touchTarget = 48;

export const tokens = { colors, fontFamily, fontSize, lineHeight, fontWeight, space, radius, touchTarget } as const;
export type Tokens = typeof tokens;
