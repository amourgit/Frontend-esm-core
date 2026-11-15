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
    ['intranet-topbar/components/shell/SupremeIntranetTopBar.tsx'],
    ['intranet-topbar/kit/TopBarRegion.tsx'],
  ])('%s ne contient aucune logique de session', (file) => {
    expect(read(file)).not.toMatch(SESSION_LOGIC);
  });

  it("n'embarque plus ni menu utilisateur ni panneau d'identité", () => {
    expect(() => read('intranet-topbar/components/options/UserMenuOption.tsx')).toThrow();
    expect(() => read('components/user-panel-switcher/user-panel-switcher.component.tsx')).toThrow();
    // La langue (bouton, lien, fenêtre) appartient à `@egen/esm-language-app`.
    expect(() => read('intranet-topbar/components/options/LanguageOption.tsx')).toThrow();
    expect(() => read('components/change-language/change-language.modal.tsx')).toThrow();
  });

  it("ne déclare ni page de redirection racine ni extension de profil : c'est le rôle de l'app dédiée", () => {
    const routes = JSON.parse(read('routes.json')) as {
      pages: Array<{ component: string }>;
      extensions?: Array<{ name: string }>;
    };
    expect(routes.pages.map((p) => p.component)).toEqual(['root']);
    expect((routes.extensions ?? []).map((e) => e.name)).not.toContain('default-user-panel');
  });

  it("ne déclare aucune extension : navigation, lanceur, recherche… sont injectés par les apps dédiées", () => {
    const routes = JSON.parse(read('routes.json')) as { extensions?: unknown[] };
    expect(routes.extensions ?? []).toEqual([]);
  });

  it("n'embarque plus la navigation (menu déroulant, fil d'Ariane, Espace actif) : c'est `@egen/esm-navigation-app`", () => {
    for (const file of [
      'intranet-topbar/components/navigation/BreadcrumbNav.tsx',
      'intranet-topbar/components/shell/DropdownNavigation.tsx',
      'intranet-topbar/context/WorkspaceContext.tsx',
      'intranet-topbar/data/directoryData.ts',
      'intranet-topbar/global/items.tsx',
    ]) {
      expect(() => read(file)).toThrow();
    }
  });
});
