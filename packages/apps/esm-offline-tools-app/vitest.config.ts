import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'happy-dom',
    mockReset: true,
    globals: true,
    setupFiles: ['./setup-tests.ts'],
    alias: {
      '@egen/esm-framework': '@egen/esm-framework/mock',
    },
  },
});
