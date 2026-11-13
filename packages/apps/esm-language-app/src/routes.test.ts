import { describe, expect, it } from 'vitest';
import routes from './routes.json';

describe('routes.json', () => {
  it("injecte le bouton dans le slot neutre de la TopBar, au niveau, à la région et à l'ordre historiques", () => {
    expect(routes.extensions.find((e) => e.name === 'language-switcher')).toEqual(
      expect.objectContaining({
        slot: 'topbar-slot',
        component: 'languageSwitcher',
        meta: { global: true, topbar: { level: 'main', rank: 10, region: 'right', order: 10 } },
      }),
    );
  });

  it("alimente le menu utilisateur (slot user-panel-slot) et déclare sa fenêtre", () => {
    expect(routes.extensions.find((e) => e.name === 'change-language')).toEqual(
      expect.objectContaining({ slot: 'user-panel-slot', component: 'changeLanguageLink', order: 1 }),
    );
    expect(routes.modals).toEqual([{ name: 'change-language-modal', component: 'changeLanguageModal' }]);
  });
});
