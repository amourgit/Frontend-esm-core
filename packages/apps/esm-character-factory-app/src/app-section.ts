// L'app a deux sections exclusives sous la route `character-factory` : l'éditeur (moteur 3D complet) et la bibliothèque.
// Exclusives = un seul contexte WebGL à la fois (la bibliothèque démonte le moteur de l'éditeur, et inversement).
export type AppSection = 'studio' | 'library' | 'compositions';

export const APP_ROUTE = 'character-factory';
export const LIBRARY_SEGMENT = 'bibliotheque';
export const COMPOSITIONS_SEGMENT = 'compositions';

export function appSection(pathname: string): AppSection {
  const parts = pathname.split('/').filter(Boolean);
  const i = parts.indexOf(APP_ROUTE);
  if (i < 0) return 'studio';
  if (parts[i + 1] === LIBRARY_SEGMENT) return 'library';
  if (parts[i + 1] === COMPOSITIONS_SEGMENT) return 'compositions';
  return 'studio';
}
