import { getGlobalStore, useStore } from '@egen-civitas/esm-framework';
import { useMemo } from 'react';
import { useActiveAppModules } from '../hooks/useActiveAppModules';
import type { TopBarRegionKey } from './regions';

// =============================================================================
//  LAYOUT DE LA TOPBAR — personnalisation par l'app montée
//
//  Une app (ou une page) décide de ce que la TopBar affiche pendant qu'elle est montée :
//
//    import { getGlobalStore } from '@egen-civitas/esm-framework';
//    const store = getGlobalStore('egen-topbar-layout', { claims: {} });
//    store.setState((s) => ({ claims: { ...s.claims, '@mon-org/esm-annuaire-app': {
//      regions: { 'primary:left': { hideGlobal: true }, 'primary:right': { only: ['search'] } },   // page « détail »
//      levels: { keep: ['promo'], hide: ['secondary'], background: { primary: 'linear-gradient(90deg,#0f172a,#134e4a)' } },
//    } } }));
//    // …et retirer la clé de l'app au démontage de la page.
//
//  Store global du framework (nom `egen-topbar-layout`) : utilisable depuis toute app, sans dépendance de code.
//  Les règles d'une app ne valent QUE tant qu'elle est active. Une règle de région vise la région où le contenu est
//  DÉCLARÉ (`promo:right`), même si ce contenu est affiché sur un autre niveau parce que `promo` n'est pas rendu.
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

export interface TopBarLevelsRule {
  /** Niveaux (par nom) rendus même vides pendant que l'app est active. */
  keep?: string[];
  /** Niveaux (par nom) à ne pas rendre pendant que l'app est active. */
  hide?: string[];
  /** Arrière-plan CSS par niveau (valeur de `background` : couleur, dégradé, `url(…)`…). Transparent par défaut. */
  background?: Record<string, string>;
}

export interface TopBarLayout {
  /** Clé `<niveau>:<région>` (ex. `primary:right`). */
  regions?: Partial<Record<TopBarRegionKey, TopBarRegionRule>>;
  levels?: TopBarLevelsRule;
}

export interface TopBarLayoutState {
  /** Layout par nom de module (app) propriétaire. */
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
  }, {});
}

export interface ResolvedTopBarLayout {
  /** Règle effective d'une région (fusion des apps actives). */
  ruleFor: (key: TopBarRegionKey) => TopBarRegionRule;
  levels: { keep: string[]; hide: string[]; background: Record<string, string> };
}

/** Layout effectif : fusion des layouts des apps actuellement actives. */
export function useTopBarLayout(): ResolvedTopBarLayout {
  const { claims } = useStore(getTopBarLayoutStore());
  const active = useActiveAppModules();
  return useMemo(() => {
    const layouts = Object.entries(claims)
      .filter(([owner]) => active.has(owner))
      .map(([, layout]) => layout);
    // Règle mémorisée par région : même objet tant que les claims/apps actives ne changent pas (références stables
    // pour les `select` / `useCallback` des slots, sinon chaque rendu relancerait leurs effets).
    const cache = new Map<TopBarRegionKey, TopBarRegionRule>();
    return {
      ruleFor: (id) => {
        let rule = cache.get(id);
        if (!rule) {
          rule = mergeRules(layouts.map((l) => l.regions?.[id]).filter((r): r is TopBarRegionRule => Boolean(r)));
          cache.set(id, rule);
        }
        return rule;
      },
      levels: {
        keep: layouts.flatMap((l) => l.levels?.keep ?? []),
        hide: layouts.flatMap((l) => l.levels?.hide ?? []),
        background: Object.assign({}, ...layouts.map((l) => l.levels?.background ?? {})),
      },
    };
  }, [claims, active]);
}
