import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  plugins: [
    {
      // Les .scss importés par esm-styleguide ne sont pas chargeables par Node : on les remplace par un proxy identité.
      name: 'scss-identity',
      enforce: 'pre',
      resolveId(id) {
        if (/\.scss(\?.*)?$/.test(id)) {
          return '\0scss-identity:' + id.replace(/\.scss(\?.*)?$/, '');
        }
      },
      load(id) {
        if (id.startsWith('\0scss-identity:')) {
          return `export default new Proxy({}, { get: (_, k) => typeof k === 'string' ? k : undefined });`;
        }
      },
    },
  ],
  test: {
    environment: 'happy-dom',
    mockReset: true,
    setupFiles: ['./setup-tests.ts'],
    root: path.resolve(__dirname),
    server: {
      deps: {
        // Traité par Vite (et non par Node) pour que le plugin scss-identity s'applique aux .scss de esm-styleguide.
        inline: [/@egen-civitas\//],
      },
    },
  },
});
