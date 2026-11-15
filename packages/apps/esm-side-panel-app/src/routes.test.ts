import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import routes from './routes.json';

describe('routes.json', () => {
  it("le panneau latéral est une extension globale du slot neutre, à l'extrême droite (110), à sa place historique", () => {
    expect(routes.extensions).toEqual([
      expect.objectContaining({
        name: 'side-panel',
        slot: 'topbar-slot',
        component: 'sidePanel',
        order: 110,
        meta: { global: true, topbar: { level: 'main', rank: 10, region: 'right', order: 110 } },
      }),
    ]);
  });

  it('le composant déclaré est exporté par `index.ts`', () => {
    const index = readFileSync(join(process.cwd(), 'src', 'index.ts'), 'utf-8');
    expect(index).toContain('export const sidePanel =');
  });
});
