import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import routes from './routes.json';

describe('routes.json', () => {
  const extension = (name: string) => routes.extensions.find((e) => e.name === name);

  it('le lanceur est une extension globale du slot neutre, à droite, à sa place historique (30)', () => {
    expect(extension('app-launcher')).toEqual(
      expect.objectContaining({
        slot: 'topbar-slot',
        component: 'launcher',
        order: 30,
        meta: { global: true, topbar: { level: 'main', rank: 10, region: 'right', order: 30 } },
      }),
    );
  });

  it('le séparateur précède le lanceur (20)', () => {
    expect(extension('topbar-divider')).toEqual(
      expect.objectContaining({
        slot: 'topbar-slot',
        component: 'divider',
        meta: { global: true, topbar: { level: 'main', rank: 10, region: 'right', order: 20 } },
      }),
    );
  });

  it("chaque composant déclaré est exporté par `index.ts`", () => {
    const index = readFileSync(join(process.cwd(), 'src', 'index.ts'), 'utf-8');
    for (const { component } of routes.extensions) expect(index).toContain(`export const ${component} =`);
  });
});
