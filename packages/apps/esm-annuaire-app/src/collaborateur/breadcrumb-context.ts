import { useEffect } from 'react';
import { getGlobalStore } from '@egen-civitas/esm-framework';
import { type DirectoryEmployee } from '../data/directory-data';

// =============================================================================
//  FIL D'ARIANE — contexte de la fiche collaborateur
//
//  Le fil d'Ariane de la TopBar (`@egen/esm-navigation-app`) ne connaît aucune app : c'est la page qui publie son contexte
//  dans le store global `egen-breadcrumb-context` (maillon du collaborateur, titre de l'onglet) et le retire en partant.
// =============================================================================

const BREADCRUMB_CONTEXT_STORE = 'egen-breadcrumb-context';

interface BreadcrumbContextState {
  pathname: string | null;
  crumbs: Array<{ key: string; label: string; imageUrl?: string; copyText?: string; copyTitle?: string }>;
  entryTitle?: string | null;
}

const EMPTY: BreadcrumbContextState = { pathname: null, crumbs: [], entryTitle: null };

/** Onglets d'une fiche (hors arbre de navigation) : segment d'URL → libellé du dernier maillon. Le premier trouvé gagne. */
const TAB_TITLES: ReadonlyArray<readonly [string, string]> = [
  ['/purchase-history', 'Purchase History'],
  ['/wishlist', 'Wishlist'],
  ['/review', 'Review'],
  ['/loyalty', 'Loyalty Program'],
  ['/support', 'Support Ticket'],
  ['/insight', 'Insight'],
  ['/activity', 'Activity'],
  ['/details', 'Détails'],
];

export function tabTitleForPath(pathname: string): string | null {
  const path = pathname.toLowerCase();
  return TAB_TITLES.find(([segment]) => path.includes(segment))?.[1] ?? null;
}

/** Publie le collaborateur affiché et l'onglet actif tant que la fiche est montée sur `pathname`. */
export function useCollaborateurBreadcrumb(employee: DirectoryEmployee, employeeUuid: string, pathname: string): void {
  useEffect(() => {
    const store = getGlobalStore<BreadcrumbContextState>(BREADCRUMB_CONTEXT_STORE, EMPTY);
    store.setState({
      pathname,
      crumbs: [
        {
          key: `collab-${employeeUuid}`,
          label: employee.fullName,
          imageUrl: employee.avatar,
          copyText: employeeUuid,
          copyTitle: "Cliquer pour copier l'UUID du collaborateur",
        },
      ],
      entryTitle: tabTitleForPath(pathname),
    });
    return () => store.setState(EMPTY);
  }, [employee.fullName, employee.avatar, employeeUuid, pathname]);
}
