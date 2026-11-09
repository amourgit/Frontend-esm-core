import { TOPBAR_HARD_MAX_LEVELS } from './regions';

// =============================================================================
//  NIVEAUX — quels niveaux la TopBar rend, dans quel ordre, et où va le contenu d'un niveau non rendu
//
//  Un niveau existe parce que du contenu visible le déclare (voir placement.ts) ou parce que la config / une app active
//  le garde (`keep`). Règles (uniques, sans exception) :
//   1. Ordre de la pile : d'abord les niveaux listés dans `config.order` (dans cet ordre), puis les niveaux classés par
//      `rank` croissant, puis les niveaux sans rang par ordre alphabétique de nom.
//   2. Un niveau est masqué par `config.hidden` ou par `hide` d'une app active. Le premier niveau de la pile n'est
//      jamais masqué.
//   3. Au plus `config.max` niveaux sont rendus (les premiers de la pile).
//   4. Le contenu d'un niveau non rendu (masqué ou au-delà du max) s'affiche sur le niveau rendu PRÉCÉDENT dans la
//      pile (le plus proche au-dessus), dans la MÊME région ; à défaut, sur le premier niveau rendu. Rien n'est perdu.
// =============================================================================

export interface TopBarLevelsConfig {
  /** Niveaux épinglés en tête de pile, dans cet ordre (prime sur les rangs déclarés par les apps). */
  order: string[];
  /** Niveaux jamais rendus. */
  hidden: string[];
  /** Niveaux rendus même sans contenu (rangée vide). */
  keep: string[];
  /** Nombre maximal de niveaux rendus. */
  max: number;
}

export const DEFAULT_LEVELS_CONFIG: TopBarLevelsConfig = { order: [], hidden: [], keep: [], max: 8 };

/** Un niveau déclaré par du contenu visible, avec son rang éventuel. */
export interface DeclaredLevel {
  id: string;
  rank?: number;
}

export interface TopBarLevelsResolution {
  /** Niveaux rendus, de haut en bas. */
  levels: string[];
  /** Tous les niveaux connus, dans l'ordre de la pile (rendus ou non). */
  stack: string[];
  /** Niveau rendu qui accueille le contenu déclaré sur `declared` ; `null` s'il n'y a aucun niveau. */
  resolve: (declared: string) => string | null;
  /** Niveaux déclarés dont le contenu s'affiche sur `level` (lui-même inclus). */
  sourcesOf: (level: string) => string[];
}

const strings = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : []);

/** Fusionne les rangs d'un même niveau : le plus petit l'emporte. */
function mergeRanks(declared: readonly DeclaredLevel[]): Map<string, number | undefined> {
  const ranks = new Map<string, number | undefined>();
  for (const { id, rank } of declared) {
    const known = ranks.get(id);
    const r = typeof rank === 'number' && Number.isFinite(rank) ? rank : undefined;
    ranks.set(id, known === undefined ? r : r === undefined ? known : Math.min(known, r));
  }
  return ranks;
}

/** Pile ordonnée (règle 1). Fonction pure. */
export function orderLevels(
  ids: Iterable<string>,
  ranks: ReadonlyMap<string, number | undefined>,
  order: readonly string[],
): string[] {
  const pinned = new Map(order.map((id, i) => [id, i] as const));
  const group = (id: string) => (pinned.has(id) ? 0 : ranks.get(id) !== undefined ? 1 : 2);
  return [...new Set(ids)].sort((a, b) => {
    const ga = group(a);
    const gb = group(b);
    if (ga !== gb) return ga - gb;
    if (ga === 0) return pinned.get(a)! - pinned.get(b)!;
    if (ga === 1) return ranks.get(a)! - ranks.get(b)! || (a < b ? -1 : a > b ? 1 : 0);
    return a < b ? -1 : a > b ? 1 : 0;
  });
}

/** Calcul pur (testable) des niveaux rendus. */
export function computeLevels(
  config: Partial<TopBarLevelsConfig> | undefined,
  declared: readonly DeclaredLevel[],
  runtime: { keep?: readonly string[]; hide?: readonly string[] } = {},
): TopBarLevelsResolution {
  const rawMax =
    typeof config?.max === 'number' && Number.isFinite(config.max) ? Math.trunc(config.max) : DEFAULT_LEVELS_CONFIG.max;
  const max = Math.min(TOPBAR_HARD_MAX_LEVELS, Math.max(1, rawMax));
  const hidden = new Set([...strings(config?.hidden), ...(runtime.hide ?? [])]);

  const ranks = mergeRanks(declared);
  const keep = [...strings(config?.keep), ...(runtime.keep ?? [])];
  const stack = orderLevels([...ranks.keys(), ...keep], ranks, strings(config?.order));

  const rendered = stack.filter((id, i) => i === 0 || !hidden.has(id)).slice(0, max);
  const renderedSet = new Set(rendered);

  const resolve = (id: string): string | null => {
    if (renderedSet.has(id)) return id;
    const at = stack.indexOf(id);
    for (let i = at - 1; i >= 0; i--) if (renderedSet.has(stack[i])) return stack[i];
    return rendered[0] ?? null;
  };
  const sourcesOf = (level: string) => {
    const set = new Set<string>([level]);
    ranks.forEach((_, id) => resolve(id) === level && set.add(id));
    return [...set].sort((a, b) => stack.indexOf(a) - stack.indexOf(b));
  };
  return { levels: rendered, stack, resolve, sourcesOf };
}
