import { vi } from 'vitest';

// Mock du framework pour les tests de rendu : on garde les VRAIS composants du
// styleguide utilisés par l'app (FilterBar, système de fond de page) et on ne
// remplace que ce qui touche à l'audio / aux toasts. L'alias `@egen-test/styleguide-dist`
// est défini dans vitest.config.ts (résolu depuis node_modules).
export async function frameworkMock() {
  const dist = '@egen-test/styleguide-dist';
  const filters = await import(/* @vite-ignore */ `${dist}/filters/index.js`);
  const bg = await import(/* @vite-ignore */ `${dist}/page-background/index.js`);
  return { ...filters, ...bg, playXboxSound: vi.fn(), showToast: vi.fn() };
}
