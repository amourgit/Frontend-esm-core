// L'app a deux sections exclusives sous la route `character-factory` : l'éditeur (moteur 3D complet) et la bibliothèque.
// Exclusives = un seul contexte WebGL à la fois (la bibliothèque démonte le moteur de l'éditeur, et inversement).
export type AppSection = 'studio' | 'library';

export const APP_ROUTE = 'character-factory';
export const LIBRARY_SEGMENT = 'bibliotheque';

export function appSection(pathname: string): AppSection {
  const parts = pathname.split('/').filter(Boolean);
  const i = parts.indexOf(APP_ROUTE);
  return i >= 0 && parts[i + 1] === LIBRARY_SEGMENT ? 'library' : 'studio';
}
