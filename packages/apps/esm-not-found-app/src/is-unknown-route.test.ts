import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { pathToActiveWhen, registerApplication, unregisterApplication } from 'single-spa';
import { PROBE_SEGMENT, buildProbeLocation, isUnknownRoute } from './is-unknown-route';

// Test d'intégration avec le VRAI single-spa : les apps sont enregistrées avec les mêmes fonctions d'activation
// que `esm-routes` (route chaîne → pathToActiveWhen, routeRegex → test du chemin sous la base du Shell).
const BASE = '/egen-civitas/spa/';
const at = (path: string) => new URL(`${BASE}${path}`, window.location.origin) as unknown as Location;

const lifecycles = () => Promise.resolve({ bootstrap: async () => undefined, mount: async () => undefined, unmount: async () => undefined });
const regexPage = (regex: RegExp) => (location: Location) => regex.test(location.pathname.replace(BASE, ''));
const registered: string[] = [];
const register = (name: string, activeWhen: any) => {
  registerApplication({ name, app: lifecycles, activeWhen });
  registered.push(name);
};

describe('isUnknownRoute (single-spa réel)', () => {
  beforeAll(() => {
    (window as any).getEgenSpaBase = () => BASE;
    // Pages internes : routes chaînes, comme `home` ou `annuaire`.
    register('home', pathToActiveWhen(`${BASE}home`));
    register('annuaire', pathToActiveWhen(`${BASE}annuaire`));
    // App EXTERNE ajoutée à l'exécution : jamais dans une liste de ce composant (le cas du bug).
    register('@civitas/esm-penpot-app', pathToActiveWhen(`${BASE}penpot`));
    // Apps toujours actives (sauf login) : pied de page, assistant — actives aussi sur la sonde.
    register('footer', regexPage(/^(?!(?:login|logout|change-password)\/?)/));
    // La 404 elle-même : fourre-tout hors racine vide.
    register('not-found', regexPage(/^(?!$)/));
  });

  afterEach(() => undefined);

  it.each(['home', 'home/sous-page', 'annuaire', 'penpot', 'penpot/projet/42'])(
    'route connue « %s » : pas de 404',
    (path) => {
      expect(isUnknownRoute(at(path))).toBe(false);
    },
  );

  it('REPRODUIT LE BUG CORRIGÉ : une app externe (penpot) absente de toute liste n’est plus prise pour une 404', () => {
    expect(isUnknownRoute(at('penpot'))).toBe(false);
  });

  it.each(['nimporte-quoi', 'a/b/c', 'penpotx-ou-presque', 'hom'])('route inconnue « %s » : 404', (path) => {
    expect(isUnknownRoute(at(path))).toBe(true);
  });

  it('une app enregistrée APRÈS coup (externe ajoutée au démarrage suivant) est prise en compte sans modifier ce code', () => {
    expect(isUnknownRoute(at('conception'))).toBe(true);
    register('@civitas/esm-autre-app', pathToActiveWhen(`${BASE}conception`));
    expect(isUnknownRoute(at('conception'))).toBe(false);
  });

  it('la sonde est sous la base du Shell et ne correspond à aucune page', () => {
    const probe = buildProbeLocation();
    expect(probe.pathname).toBe(`${BASE}${PROBE_SEGMENT}`);
    expect(probe.origin).toBe(window.location.origin);
    expect(isUnknownRoute(probe as unknown as Location)).toBe(true);
  });

  it('base du Shell sans barre finale : la sonde reste valide', () => {
    (window as any).getEgenSpaBase = () => '/egen-civitas/spa';
    expect(buildProbeLocation().pathname).toBe(`/egen-civitas/spa/${PROBE_SEGMENT}`);
    (window as any).getEgenSpaBase = () => BASE;
  });

  afterEach(async () => {
    // Les apps de départ restent enregistrées pour tout le fichier ; on retire seulement l'ajout dynamique.
    if (registered.includes('@civitas/esm-autre-app')) {
      await unregisterApplication('@civitas/esm-autre-app');
      registered.splice(registered.indexOf('@civitas/esm-autre-app'), 1);
    }
  });
});
