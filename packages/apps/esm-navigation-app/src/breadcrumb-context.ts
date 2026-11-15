import { getGlobalStore, useStore } from '@egen-civitas/esm-framework';
import { useLocation } from 'react-router-dom';

// =============================================================================
//  CONTEXTE DU FIL D'ARIANE — contrat d'ouverture, publié par les apps
//
//  Le fil d'Ariane ne connaît AUCUNE app. L'arbre « Accueil › Section › Entrée » vient des entrées `topbar-nav-slot`.
//  Quand une page a un contexte qui n'est pas dans cet arbre (une fiche collaborateur, un dossier, une commande…),
//  c'est LA PAGE qui le publie, dans le store global `egen-breadcrumb-context` (même principe que `egen-spaces-sites`) :
//
//      const store = getGlobalStore('egen-breadcrumb-context', { pathname: null, crumbs: [], entryTitle: null });
//      store.setState({ pathname: location.pathname, crumbs: [{ key: 'collab-42', label: 'Awa Ndong', copyText: '42' }] });
//      // au démontage : store.setState({ pathname: null, crumbs: [], entryTitle: null });
//
//  `pathname` lie le contexte à la page qui l'a publié : s'il ne correspond pas à la page affichée, il est ignoré (pas de
//  maillon périmé pendant une navigation). Les maillons s'insèrent entre la section et l'entrée, après les sites.
// =============================================================================

export const BREADCRUMB_CONTEXT_STORE = 'egen-breadcrumb-context';

export interface BreadcrumbContextCrumb {
  key: string;
  label: string;
  /** Vignette ronde affichée avant le libellé (ex. avatar). */
  imageUrl?: string;
  /** Identifiant affiché `#<copyText>` dans une pastille qui le copie au clic. */
  copyText?: string;
  /** Infobulle de la pastille (par défaut : « Cliquer pour copier l'identifiant »). */
  copyTitle?: string;
}

export interface BreadcrumbContextState {
  /** Page (chemin sans base) qui a publié ce contexte ; `null` : rien de publié. */
  pathname: string | null;
  crumbs: BreadcrumbContextCrumb[];
  /** Titre du dernier maillon quand l'arbre de navigation n'a aucune entrée pour cette page (onglet d'une fiche…). */
  entryTitle?: string | null;
}

export const EMPTY_BREADCRUMB_CONTEXT: BreadcrumbContextState = { pathname: null, crumbs: [], entryTitle: null };

const normalize = (pathname: string) => pathname.replace(/\/+$/, '') || '/';

/** Contexte publié pour la page affichée ; vide s'il vient d'une autre page. */
export function selectBreadcrumbContext(state: BreadcrumbContextState, pathname: string): BreadcrumbContextState {
  return state.pathname !== null && normalize(state.pathname) === normalize(pathname) ? state : EMPTY_BREADCRUMB_CONTEXT;
}

export function useBreadcrumbContext(): BreadcrumbContextState {
  const { pathname } = useLocation();
  const state = useStore(getGlobalStore<BreadcrumbContextState>(BREADCRUMB_CONTEXT_STORE, EMPTY_BREADCRUMB_CONTEXT));
  return selectBreadcrumbContext(state, pathname);
}
