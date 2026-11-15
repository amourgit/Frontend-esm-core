import { describe, expect, it } from 'vitest';
import routes from './routes.json';

describe('routes.json', () => {
  it("la recherche est une extension globale du slot neutre de la TopBar, à droite, à sa place historique", () => {
    expect(routes.extensions).toEqual([
      expect.objectContaining({
        name: 'search',
        slot: 'topbar-slot',
        component: 'search',
        order: 0,
        meta: { global: true, topbar: { level: 'main', rank: 10, region: 'right', order: 0 } },
      }),
    ]);
  });
});
