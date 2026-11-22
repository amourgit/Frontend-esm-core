import { checkActivityFunctions } from 'single-spa';

// =============================================================================
//  Détection d'une route INCONNUE — sans liste de routes.
//
//  Avant, `routes.json` énumérait en dur les routes des autres apps dans un routeRegex négatif : toute route
//  absente de la liste (donc TOUTE app externe ajoutée au Core, qui n'existe qu'à l'exécution) affichait la
//  404 par-dessus sa propre page.
//
//  Principe : single-spa sait quelles apps sont actives pour une URL (`checkActivityFunctions`). On compare
//  les apps actives sur l'URL courante à celles actives sur une URL SONDE qui ne correspond à aucune page :
//  l'écart est exactement l'ensemble des pages propres à la route courante. Les apps « toujours actives »
//  (pied de page, assistant, cette 404 elle-même) sont actives sur les deux et s'annulent. Écart vide → aucune
//  page ne revendique cette route → 404. Aucune liste à maintenir : interne, externe, dev ou production.
// =============================================================================

export const PROBE_SEGMENT = '__egen-not-found-probe__';

/** URL sonde : sous la base du Shell, sur un chemin qu'aucune page ne revendique. */
export function buildProbeLocation(): URL {
  const base = typeof window.getEgenSpaBase === 'function' ? window.getEgenSpaBase() : '/';
  const prefix = base.endsWith('/') ? base : `${base}/`;
  return new URL(`${prefix}${PROBE_SEGMENT}`, window.location.origin);
}

/** Vrai si aucune page propre à la route courante n'est enregistrée (→ afficher la 404). */
export function isUnknownRoute(location: Location = window.location): boolean {
  const alwaysActive = new Set(checkActivityFunctions(buildProbeLocation() as unknown as Location));
  return checkActivityFunctions(location).every((name) => alwaysActive.has(name));
}
