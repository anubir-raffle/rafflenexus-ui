import { defineConfig } from 'vitest/config';

// Unit tests run against the source in a simulated browser (jsdom). `npm test` runs them before every release.
export default defineConfig({
  test: {
    environment: 'jsdom',
    include: ['tests/**/*.test.{ts,tsx}'],
    setupFiles: ['tests/setup.ts'],
  },
});
