import { createRequire } from 'node:module';
import { dirname } from 'node:path';
import { defineConfig } from 'vitest/config';

// Dossier `dist` du styleguide installé : les tests de rendu y importent les vrais
// composants (FilterBar, fond de page) sans dépendre d'un chemin propre à une machine.
const styleguideDist = dirname(createRequire(import.meta.url).resolve('@egen-civitas/esm-styleguide'));

export default defineConfig({
  test: {
    environment: 'happy-dom',
    mockReset: true,
    globals: true,
    setupFiles: ['./src/test-utils/no-waapi.ts'],
    // Rendus lourds (annuaire complet + animations) : 5 s ne suffisent pas quand turbo lance toutes les suites en parallèle.
    testTimeout: 20000,
    hookTimeout: 20000,
    alias: {
      '@egen-test/styleguide-dist': styleguideDist,
      '@egen-civitas/esm-framework/src/internal': '@egen-civitas/esm-framework/mock',
      '@egen-civitas/esm-framework': '@egen-civitas/esm-framework/mock',
    },
  },
});
