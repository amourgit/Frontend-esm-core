import { getGlobalStore, useStore } from '@egen-civitas/esm-framework';
import { useMemo } from 'react';
import { useActiveAppModules } from '../hooks/useActiveAppModules';
import { TOPBAR_REGION_IDS, type TopBarRegionId } from './regions';

// =============================================================================
//  LAYOUT DE LA TOPBAR — personnalisation d'une région par l'app montée
//
//  Une app (ou une page) décide de ce que la TopBar affiche pendant qu'elle est montée :
//
//    import { getGlobalStore } from '@egen-civitas/esm-framework';
//    const store = getGlobalStore('egen-topbar-layout', { claims: {} });
//    // page « détail d'un collaborateur » : niveau 1 réduit au retour + recherche
//    store.setState((s) => ({ claims: { ...s.claims, '@mon-org/esm-annuaire-app': {
//      'l1-left': { hideGlobal: true }, 'l1-right': { only: ['search'] } } } }));
//    // …et la retirer au démontage de la page (supprimer la clé).
//
//  Le store est un store global du framework (nom `egen-topbar-layout`), donc utilisable depuis toute app
//  sans dépendance de code. Les règles d'une app ne s'appliquent QUE tant que cette app est active : quitter
//  l'app rend la TopBar à son état normal, sans nettoyage obligatoire. `applyTopBarLayout` (ci-dessous) est le
//  raccourci pour le code de cette app.
// =============================================================================

export const TOPBAR_LAYOUT_STORE = 'egen-topbar-layout';

export interface TopBarRegionRule {
  /** Masque toute la région. */
  hidden?: boolean;
  /** N'affiche QUE ces éléments / extensions (par `id` d'élément ou `name` d'extension). */
  only?: string[];
  /** Masque ces éléments / extensions. */
  hide?: string[];
  /** Masque tout ce qui est global (éléments globaux et extensions `meta.global`) ; l'app garde ses propres ajouts. */
  hideGlobal?: boolean;
}

export type TopBarLayout = Partial<Record<TopBarRegionId, TopBarRegionRule>>;

export interface TopBarLayoutState {
  /** Règles par nom de module (app) propriétaire. */
  claims: Record<string, TopBarLayout>;
}

export const getTopBarLayoutStore = () => getGlobalStore<TopBarLayoutState>(TOPBAR_LAYOUT_STORE, { claims: {} });

/** Applique le layout d'une app ; retourne la fonction qui le retire (à appeler au démontage). */
export function applyTopBarLayout(owner: string, layout: TopBarLayout): () => void {
  const store = getTopBarLayoutStore();
  store.setState((s) => ({ claims: { ...s.claims, [owner]: layout } }));
  return () =>
    store.setState((s) => {
      const { [owner]: _removed, ...rest } = s.claims;
      return { claims: rest };
    });
}

const EMPTY: TopBarRegionRule = {};

/** Vrai si un élément / une extension (`id`) peut s'afficher sous la règle d'une région. */
export function isAllowedByRule(id: string, isGlobal: boolean, rule: TopBarRegionRule): boolean {
  if (rule.hidden) return false;
  if (rule.only && !rule.only.includes(id)) return false;
  if (rule.hide?.includes(id)) return false;
  if (rule.hideGlobal && isGlobal) return false;
  return true;
}

/** Fusion de règles : masquages cumulés, `only` croisés, drapeaux en OU. */
export function mergeRules(rules: TopBarRegionRule[]): TopBarRegionRule {
  return rules.reduce<TopBarRegionRule>((acc, r) => {
    const only = r.only ? (acc.only ? acc.only.filter((n) => r.only!.includes(n)) : r.only) : acc.only;
    return {
      hidden: acc.hidden || r.hidden,
      hideGlobal: acc.hideGlobal || r.hideGlobal,
      hide: [...(acc.hide ?? []), ...(r.hide ?? [])],
      only,
    };
  }, EMPTY);
}

/** Règle effective d'une région : fusion des règles des apps actuellement actives. */
export function useRegionRule(region: TopBarRegionId): TopBarRegionRule {
  const { claims } = useStore(getTopBarLayoutStore());
  const active = useActiveAppModules();
  return useMemo(
    () =>
      mergeRules(
        Object.entries(claims)
          .filter(([owner]) => active.has(owner))
          .map(([, layout]) => layout[region])
          .filter((r): r is TopBarRegionRule => Boolean(r)),
      ),
    [claims, active, region],
  );
}

export { TOPBAR_REGION_IDS };
