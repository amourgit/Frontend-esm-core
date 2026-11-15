import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import routes from './routes.json';

describe('routes.json', () => {
  it('la navigation est une extension globale du slot neutre, au centre du niveau `navigation` (rang 20), comme avant', () => {
    expect(routes.extensions.find((e) => e.name === 'topbar-navigation')).toEqual(
      expect.objectContaining({
        slot: 'topbar-slot',
        component: 'navigation',
        order: 0,
        meta: { global: true, topbar: { level: 'navigation', rank: 20, region: 'center', order: 0 } },
      }),
    );
  });

  it('chaque composant déclaré est exporté par `index.ts`', () => {
    const index = readFileSync(join(process.cwd(), 'src', 'index.ts'), 'utf-8');
    for (const { component } of routes.extensions) expect(index).toContain(`export const ${component} =`);
  });

  it("le contrat `link` / `breadcrumb-item` reste déclaré (aucune app ne doit perdre ces extensions)", () => {
    expect(routes.extensions.map((e) => e.name)).toEqual(expect.arrayContaining(['link', 'breadcrumb-item']));
  });
});
