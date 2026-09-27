import { defineConfig } from 'vitest/config';

// Also runs the Edge Function unit tests (supabase/functions) and the mobile app's pure modules.
export default defineConfig({
  test: {
    dir: '../..',
    include: [
      'packages/shared/src/**/*.test.ts',
      'supabase/functions/**/__tests__/*.test.ts',
      // Pure (no React Native) modules of the mobile app.
      'apps/mobile/src/**/__tests__/*.test.ts',
    ],
  },
});
