// The app's look, matched to the website's signed-in pages (apps/web/src/app/globals.css):
// deep green primary, mint accent, cool off-white page, Plus Jakarta Sans for headings and Inter for text.
// Built for bright sun on low-cost Android phones: strong contrast, body text 16 or more, 48px tap targets.

export const color = {
  primary: '#003620', // headings, active tab, dark cards
  primaryContainer: '#134e33', // main buttons
  secondary: '#006c49', // links, icons, progress
  mint: '#6cf8bb', // highlight on dark green
  mintSoft: '#e7f8ef', // icon tiles, selected rows
  page: '#f8f9ff',
  card: '#ffffff',
  ink: '#0b1c30',
  inkSoft: '#404943',
  outline: '#c0c9c0',
  line: '#e2e8f0',
  track: '#e5eeff',
  onDark: '#ffffff',
  onDarkSoft: '#cfe9db',
  amber: '#b45309',
  amberSoft: '#fdf1d8',
  danger: '#b91c1c',
  dangerSoft: '#fef2f2',
  info: '#1e5a8a',
  infoSoft: '#e8f1fa',
} as const;

export const font = {
  display: 'PlusJakartaSans_800ExtraBold',
  heading: 'PlusJakartaSans_700Bold',
  body: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
} as const;

export const space = { 1: 4, 2: 8, 3: 12, 4: 16, 5: 20, 6: 24, 8: 32, 10: 40 } as const;

export const radius = { sm: 10, md: 12, lg: 16, xl: 20, pill: 999 } as const;

export const tap = 48;

export const shadow = {
  shadowColor: '#0b1c30',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.06,
  shadowRadius: 8,
  elevation: 2,
} as const;
