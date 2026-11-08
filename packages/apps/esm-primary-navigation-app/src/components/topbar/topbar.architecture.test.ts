import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

// Règle d'architecture : la TopBar est un squelette neutre. Elle ne connaît NI la session, NI l'authentification, NI
// l'identité de l'utilisateur : tout cela appartient à `@egen/esm-user-profile-app`, qui injecte son élément par
// extension. Ces tests verrouillent la règle contre une réintroduction accidentelle.

const read = (relative: string) => readFileSync(resolve(__dirname, '../..', relative), 'utf8');
const SESSION_LOGIC = /useSession|useTenantMode|getSessionStore|<Navigate\b|refetchCurrentUser/;

describe('TopBar : aucune logique de session ni de profil', () => {
  it.each([
    ['components/topbar/topbar.component.tsx'],
    ['intranet-topbar/global/items.tsx'],
    ['intranet-topbar/kit/TopBarRegion.tsx'],
  ])('%s ne contient aucune logique de session', (file) => {
    expect(read(file)).not.toMatch(SESSION_LOGIC);
  });

  it("n'embarque plus ni menu utilisateur ni panneau d'identité", () => {
    expect(() => read('intranet-topbar/components/options/UserMenuOption.tsx')).toThrow();
    expect(() => read('components/user-panel-switcher/user-panel-switcher.component.tsx')).toThrow();
  });

  it("ne déclare ni page de redirection racine ni extension de profil : c'est le rôle de l'app dédiée", () => {
    const routes = JSON.parse(read('routes.json')) as {
      pages: Array<{ component: string }>;
      extensions: Array<{ name: string }>;
    };
    expect(routes.pages.map((p) => p.component)).toEqual(['root']);
    expect(routes.extensions.map((e) => e.name)).not.toContain('default-user-panel');
  });
});
