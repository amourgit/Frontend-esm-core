import { defineConfig } from 'vitest/config';

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
    globals: true,
    server: {
      deps: {
        // Traité par Vite (et non par Node) : sinon les dépendances CommonJS et les .scss de esm-styleguide cassent.
        inline: [/@egen-civitas\//],
      },
    },
    alias: {
      '^lodash-es$': 'lodash',
      '^lodash-es/(.*)$': 'lodash/$1',
      '@egen-civitas/esm-framework/src/internal': '@egen-civitas/esm-framework/mock',
      '@egen-civitas/esm-framework': '@egen-civitas/esm-framework/mock',
    },
    coverage: {
      provider: 'v8',
    },
  },
});
