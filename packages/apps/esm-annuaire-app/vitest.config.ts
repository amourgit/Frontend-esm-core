import { createRequire } from 'node:module';
import { dirname } from 'node:path';
import { defineConfig } from 'vitest/config';

// Dossier `dist` du styleguide installé : les tests de rendu y importent les vrais
// composants (FilterBar, fond de page) sans dépendre d'un chemin propre à une machine.
const styleguideDist = dirname(createRequire(import.meta.url).resolve('@egen-civitas/esm-styleguide'));

export default defineConfig({
  plugins: [
    {
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
    globals: true,
    alias: {
      '@egen-test/styleguide-dist': styleguideDist,
      '@egen-civitas/esm-framework/src/internal': '@egen-civitas/esm-framework/mock',
      '@egen-civitas/esm-framework': '@egen-civitas/esm-framework/mock',
    },
  },
});
