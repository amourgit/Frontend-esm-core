import { getGlobalStore, useStore } from '@egen-civitas/esm-framework';
import { isEqual } from 'lodash-es';

// =============================================================================
//  CONTEXTE ACTIF : ESPACE + SITE
//
//  Un store global du framework (`egen-spaces-sites`) : n'importe quelle app peut le lire SANS dépendance de code
//  (`getGlobalStore('egen-spaces-sites')`), comme la TopBar le fait pour sa navigation et son fil d'Ariane. Seule cette
//  app l'écrit.
//
//    spaces   : les Espaces disponibles (config du déploiement)
//    spaceId  : l'Espace actif
//    sites    : le registre des sites, À PLAT (chaque site référence son parent par `parentId` : profondeur illimitée)
//    siteId   : le site actif (n'importe quel niveau de l'arbre), ou `null` = « tous les sites »
// =============================================================================

export const SPACES_SITES_STORE = 'egen-spaces-sites';

export interface Space {
  id: string;
  name: string;
  subtitle?: string;
}

export interface SiteNode {
  id: string;
  /** Parent dans l'arbre ; absent, `null` ou vide : site racine. */
  parentId?: string | null;
  name: string;
  shortName?: string;
  category?: string;
  description?: string;
  /** Ordre parmi les sites du même parent (défaut 0) ; à égalité : par nom. */
  order?: number;
}

export interface SpacesSitesState {
  spaces: Space[];
  spaceId: string | null;
  sites: SiteNode[];
  siteId: string | null;
}

const INITIAL_STATE: SpacesSitesState = { spaces: [], spaceId: null, sites: [], siteId: null };

export const getSpacesSitesStore = () => getGlobalStore<SpacesSitesState>(SPACES_SITES_STORE, INITIAL_STATE);

export function useSpacesSites(): SpacesSitesState {
  return useStore(getSpacesSitesStore());
}

const isNonEmptyString = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0;

export function isValidSpace(value: unknown): value is Space {
  const space = value as Space;
  return !!space && isNonEmptyString(space.id) && isNonEmptyString(space.name);
}

/**
 * Déclare les Espaces et choisit l'Espace actif : celui déjà actif s'il existe encore, sinon `defaultSpaceId`, sinon le
 * premier. Idempotent : sans changement, le store n'est pas touché (aucun rendu inutile).
 */
export function initializeSpaces(spaces: unknown[], defaultSpaceId?: string): void {
  const store = getSpacesSitesStore();
  const seen = new Set<string>();
  const valid = spaces.filter(isValidSpace).filter((space) => !seen.has(space.id) && !!seen.add(space.id));
  const { spaceId } = store.getState();
  const next =
    valid.find((s) => s.id === spaceId)?.id ?? valid.find((s) => s.id === defaultSpaceId)?.id ?? valid[0]?.id ?? null;

  const state = store.getState();
  if (isEqual(state.spaces, valid) && state.spaceId === next) return;
  store.setState({ spaces: valid, spaceId: next });
}

/** Change d'Espace. Un identifiant inconnu ou déjà actif est ignoré. */
export function setActiveSpace(id: string): void {
  const store = getSpacesSitesStore();
  const { spaces, spaceId } = store.getState();
  if (id === spaceId || !spaces.some((s) => s.id === id)) return;
  store.setState({ spaceId: id });
}

/** Publie le registre des sites. Le site actif est conservé tant qu'il existe, sinon réinitialisé. */
export function setSites(sites: SiteNode[]): void {
  const store = getSpacesSitesStore();
  const state = store.getState();
  if (isEqual(state.sites, sites)) return;
  const siteId = state.siteId && sites.some((s) => s.id === state.siteId) ? state.siteId : null;
  store.setState({ sites, siteId });
}

/** Change de site actif (n'importe quel niveau) ; `null` = tous les sites. Un site inconnu est ignoré. */
export function setActiveSite(id: string | null): void {
  const store = getSpacesSitesStore();
  const { sites, siteId } = store.getState();
  if (id === siteId || (id !== null && !sites.some((s) => s.id === id))) return;
  store.setState({ siteId: id });
}

/** Remet le store à zéro (tests). */
export function resetSpacesSitesStore(): void {
  getSpacesSitesStore().setState(INITIAL_STATE);
}
