import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'happy-dom',
    mockReset: true,
    setupFiles: ['./setup-tests.ts'],
    // esm-styleguide publie des imports .scss : Vite doit les traiter (Node ne sait pas les charger).
    server: { deps: { inline: [/@egen-civitas\//] } },
  },
});
