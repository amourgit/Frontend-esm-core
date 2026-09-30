import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'happy-dom',
    mockReset: true,
    // esm-styleguide publie des imports .scss et tire workbox-window (CJS) : Vite doit les traiter.
    server: { deps: { inline: [/@egen-civitas\//, 'workbox-window'] } },
    setupFiles: ['./setup-tests.ts'],
  },
});
