import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'happy-dom',
    mockReset: true,
    setupFiles: ['./setup-tests.ts'],
    globals: true,
    alias: {
      '^lodash-es$': 'lodash',
      '^lodash-es/(.*)$': 'lodash/$1',
      '@egen/esm-framework/src/internal': '@egen/esm-framework/mock',
      '@egen/esm-framework': '@egen/esm-framework/mock',
    },
    coverage: {
      provider: 'v8',
    },
  },
});
