import { vi } from 'vitest';

// Mock du framework pour les tests de rendu : on garde les VRAIS composants du
// styleguide utilisés par l'app (FilterBar, système de fond de page) et on ne
// remplace que ce qui touche au navigateur / à l'audio / aux toasts.
export async function frameworkMock() {
  const sg = '/home/claude/work/Frontend-esm-core/node_modules/@egen-civitas/esm-styleguide/dist';
  const filters = await import(/* @vite-ignore */ `${sg}/filters/index.js`);
  const bg = await import(/* @vite-ignore */ `${sg}/page-background/index.js`);
  return { ...filters, ...bg, playXboxSound: vi.fn(), showToast: vi.fn() };
}
