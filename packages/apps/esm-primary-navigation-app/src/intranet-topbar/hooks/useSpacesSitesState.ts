import { getGlobalStore, useStore } from '@egen-civitas/esm-framework';

// =============================================================================
//  CONTEXTE ESPACE / SITE — lecture seule
//
//  L'Espace et le Site actifs, et le registre des sites, appartiennent à `@egen/esm-spaces-sites-app`, qui les publie dans
//  un store global du framework. La TopBar le LIT (sans dépendance de code) pour filtrer sa navigation par Espace et
//  nommer les sites dans le fil d'Ariane ; elle ne l'écrit jamais.
// =============================================================================

export const SPACES_SITES_STORE = 'egen-spaces-sites';

export interface SpaceInfo {
  id: string;
  name: string;
}

export interface SiteInfo {
  id: string;
  parentId?: string | null;
  name: string;
  shortName?: string;
}

export interface SpacesSitesState {
  spaces: SpaceInfo[];
  spaceId: string | null;
  sites: SiteInfo[];
  siteId: string | null;
}

const INITIAL_STATE: SpacesSitesState = { spaces: [], spaceId: null, sites: [], siteId: null };

export function useSpacesSitesState(): SpacesSitesState {
  return useStore(getGlobalStore<SpacesSitesState>(SPACES_SITES_STORE, INITIAL_STATE));
}
