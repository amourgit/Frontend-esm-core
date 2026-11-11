import { describe, expect, it } from 'vitest';
import routes from './routes.json';

describe('routes.json', () => {
  const extension = (name: string) => routes.extensions.find((e) => e.name === name);

  it("injecte les sélecteurs dans le slot NEUTRE de la TopBar, niveau et place déclarés dans meta.topbar, à droite du logo", () => {
    expect(extension('context-selectors')).toEqual(
      expect.objectContaining({
        slot: 'topbar-slot',
        component: 'contextSelectors',
        meta: { global: true, topbar: { level: 'main', rank: 10, region: 'left', after: 'brand-logo' } },
      }),
    );
  });

  it("ne fige aucun numéro de niveau dans un nom de slot", () => {
    expect(JSON.stringify(routes)).not.toMatch(/topbar-l\d|l\d-(left|center|right)/);
  });

  it("propose le choix de l'Espace dans le panneau latéral", () => {
    expect(extension('space-selector-menu')).toEqual(
      expect.objectContaining({ slot: 'staggered-menu-slot', component: 'spaceMenu', meta: expect.objectContaining({ title: 'Espace', global: true }) }),
    );
  });
});
