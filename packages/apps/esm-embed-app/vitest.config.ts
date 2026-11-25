import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  test: {
    environment: 'happy-dom',
    // Les tests ne doivent jamais charger réellement `iframe.src` (aucun accès réseau).
    environmentOptions: { happyDOM: { settings: { disableIframePageLoading: true } } },
    mockReset: true,
    setupFiles: ['./setup-tests.ts'],
    root: path.resolve(__dirname),
    server: {
      deps: {
        // Traité par Vite (et non par Node) : les modules CSS et les dépendances CommonJS de esm-styleguide.
        inline: [/@egen-civitas\//],
      },
    },
  },
});
