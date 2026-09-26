import { defineConfig } from 'vitest/config';

// Also runs the Edge Function unit tests (supabase/functions), which use only web-standard APIs.
export default defineConfig({
  test: {
    dir: '../..',
    include: ['packages/shared/src/**/*.test.ts', 'supabase/functions/**/__tests__/*.test.ts'],
  },
});
