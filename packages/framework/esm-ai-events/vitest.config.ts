import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'happy-dom',
    mockReset: true,
    globals: true,
    alias: {
      '@eigen/esm-framework/src/internal': '@eigen/esm-framework/mock',
      '@eigen/esm-framework': '@eigen/esm-framework/mock',
    },
  },
});
