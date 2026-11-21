import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'happy-dom',
    mockReset: true,
    globals: true,
    setupFiles: ['./setup-tests.ts'],
    server: {
      deps: {
        // Traité par Vite (et non par Node) : les modules CSS et les dépendances CommonJS de esm-styleguide.
        inline: [/@egen-civitas\//],
      },
    },
    alias: {
      '@egen-civitas/esm-framework/src/internal': '@egen-civitas/esm-framework/mock',
      '@egen-civitas/esm-framework': '@egen-civitas/esm-framework/mock',
    },
  },
});
