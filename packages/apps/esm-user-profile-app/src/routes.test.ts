import { describe, expect, it } from 'vitest';
import routes from './routes.json';

describe('routes.json', () => {
  const extension = (name: string) => routes.extensions.find((e) => e.name === name);

  it('le menu utilisateur est une extension globale du slot neutre de la TopBar, placée à droite à sa place historique', () => {
    expect(extension('user-menu')).toEqual(
      expect.objectContaining({
        slot: 'topbar-slot',
        component: 'userMenu',
        order: 90,
        meta: { global: true, topbar: { level: 'main', rank: 10, region: 'right', order: 90 } },
      }),
    );
  });

  it("l'identité de la session est la première ligne du panneau utilisateur", () => {
    expect(extension('default-user-panel')).toEqual(
      expect.objectContaining({ slot: 'user-panel-slot', component: 'userPanel', order: 0 }),
    );
  });

  it('le garde couvre tout sauf login, logout et change-password ; la redirection ne couvre que la racine', () => {
    const [guard, redirect] = routes.pages;
    expect(guard.component).toBe('sessionGuard');
    const guardRegex = new RegExp(guard.routeRegex);
    expect(['home', 'annuaire/contacts', 'sites'].every((r) => guardRegex.test(r))).toBe(true);
    expect(['login', 'logout', 'change-password'].some((r) => guardRegex.test(r))).toBe(false);

    expect(redirect.component).toBe('rootRedirect');
    const redirectRegex = new RegExp(redirect.routeRegex);
    expect(redirectRegex.test('')).toBe(true);
    expect(redirectRegex.test('home')).toBe(false);
  });
});
