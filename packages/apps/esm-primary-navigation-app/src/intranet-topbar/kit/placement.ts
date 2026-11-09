import { isContentRegion, isLevelId, isRegion, type TopBarContentRegion, type TopBarRegion } from './regions';

// =============================================================================
//  PLACEMENT — ce qu'une app DÉCLARE pour positionner un composant dans la TopBar (pur, testable)
//
//  Forme (dans `meta.topbar` d'une extension du slot `topbar-slot`, ou `placement` d'un élément enregistré) :
//
//    level    nom du niveau où placer le composant (obligatoire). Le niveau est créé s'il n'existe pas ; s'il existe
//             déjà (déclaré par une autre app), le composant s'y ajoute.
//    rank     position du niveau dans la pile (nombre, croissant : plus petit = plus haut). Optionnel : un niveau sans
//             rang se place sous tous les niveaux classés, par ordre alphabétique de nom. Si plusieurs déclarations
//             donnent un rang différent au même niveau, le plus petit l'emporte. La config `topbar.levels.order`
//             prime sur tout rang.
//    region   `left` | `center` | `right` | `background` (défaut : `left`).
//    order    ordre dans la région (croissant, défaut 0).
//    before / after
//             position PAR RÉFÉRENCE : nom d'une autre extension (ou id d'un élément) du MÊME niveau. Le composant se
//             place juste avant/après la référence, dans sa région — même si elle est dans une autre région que
//             celle déclarée. Référence absente (app non montée…) : `region` + `order` s'appliquent. Cycle : les
//             références du cycle sont ignorées.
// =============================================================================

export interface TopBarPlacement {
  level: string;
  rank?: number;
  region: TopBarRegion;
  order: number;
  before?: string;
  after?: string;
}

export type PlacementWarn = (message: string) => void;

const defaultWarn: PlacementWarn = (m) => console.warn(m);

/**
 * Lit une déclaration `meta.topbar`. Retourne `null` (avec un avertissement) si elle est inutilisable : une
 * déclaration invalide n'affiche rien, jamais ne casse la TopBar.
 */
export function readPlacement(
  raw: unknown,
  fallbackOrder = 0,
  owner = 'extension inconnue',
  warn: PlacementWarn = defaultWarn,
): TopBarPlacement | null {
  if (!raw || typeof raw !== 'object') {
    warn(
      `[topbar] « ${owner} » : \`meta.topbar\` manquant (attendu : { level, region?, order?, rank?, before?, after? }).`,
    );
    return null;
  }
  const p = raw as Record<string, unknown>;
  if (!isLevelId(p.level)) {
    warn(
      `[topbar] « ${owner} » : niveau invalide « ${String(p.level)} » (minuscules, chiffres et tirets, commence par une lettre).`,
    );
    return null;
  }
  const region = p.region === undefined ? 'left' : p.region;
  if (!isRegion(region)) {
    warn(
      `[topbar] « ${owner} » : région invalide « ${String(region)} » (attendu : left | center | right | background).`,
    );
    return null;
  }
  const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : undefined);
  const ref = (v: unknown) => (typeof v === 'string' && v ? v : undefined);
  return {
    level: p.level,
    region,
    rank: num(p.rank),
    order: num(p.order) ?? fallbackOrder,
    before: ref(p.before),
    after: ref(p.after),
  };
}

/** Raccourci de configuration `"<niveau>:<région>"` (ex. `primary:right`). `null` si invalide. */
export function parsePlacementShorthand(value: unknown): { level: string; region: TopBarContentRegion } | null {
  if (typeof value !== 'string') return null;
  const i = value.lastIndexOf(':');
  if (i < 1) return null;
  const level = value.slice(0, i);
  const region = value.slice(i + 1);
  return isLevelId(level) && isContentRegion(region) ? { level, region } : null;
}

// ---- Résolution d'un niveau : régions, ordre, références ---------------------------------------------------------

export interface PlacedEntry<T = unknown> {
  /** Identifiant de référence (nom de l'extension, id de l'élément). */
  key: string;
  placement: TopBarPlacement;
  /** Rang du niveau d'origine dans la pile : quand un niveau accueille le contenu d'un niveau non rendu, ses propres entrées passent d'abord. */
  group?: number;
  /** Départage final à placement égal : une extension avant un élément, puis l'ordre alphabétique de `key`. */
  tie?: number;
  payload: T;
}

export type ResolvedRegions<T> = Record<TopBarRegion, PlacedEntry<T>[]>;

/**
 * Répartit les entrées d'UN niveau dans ses régions, dans l'ordre d'affichage.
 * 1. tri par `order`, puis départage stable ; 2. chaque entrée avec `before`/`after` valide est déplacée à côté de sa
 * référence (région de la référence, après résolution de sa propre référence). Fonction pure.
 */
export function resolveLevelEntries<T>(
  entries: readonly PlacedEntry<T>[],
  warn: PlacementWarn = defaultWarn,
): ResolvedRegions<T> {
  const byKey = new Map(entries.map((e) => [e.key, e] as const));
  const cmp = (a: PlacedEntry<T>, b: PlacedEntry<T>) =>
    (a.group ?? 0) - (b.group ?? 0) ||
    a.placement.order - b.placement.order ||
    (a.tie ?? 0) - (b.tie ?? 0) ||
    (a.key < b.key ? -1 : a.key > b.key ? 1 : 0);

  // Références valides : cible présente, différente, et hors cycle.
  const refOf = (e: PlacedEntry<T>) => e.placement.after ?? e.placement.before;
  const valid = new Map<string, string>();
  for (const e of entries) {
    const ref = refOf(e);
    if (ref && ref !== e.key && byKey.has(ref)) valid.set(e.key, ref);
  }
  const inCycle = new Set<string>();
  for (const start of valid.keys()) {
    const seen = new Set<string>();
    let cur: string | undefined = start;
    while (cur && valid.has(cur)) {
      if (seen.has(cur)) {
        seen.forEach((k) => inCycle.add(k));
        break;
      }
      seen.add(cur);
      cur = valid.get(cur);
    }
  }
  if (inCycle.size) warn(`[topbar] références circulaires ignorées : ${[...inCycle].sort().join(', ')}.`);
  inCycle.forEach((k) => valid.delete(k));

  const result: ResolvedRegions<T> = { left: [], center: [], right: [], background: [] };
  const anchors = entries.filter((e) => !valid.has(e.key)).sort(cmp);
  const followers = new Map<string, PlacedEntry<T>[]>();
  for (const e of entries) {
    const ref = valid.get(e.key);
    if (ref) followers.set(ref, [...(followers.get(ref) ?? []), e]);
  }

  const place = (e: PlacedEntry<T>, region: TopBarRegion) => {
    const mine = (followers.get(e.key) ?? []).sort(cmp);
    for (const f of mine.filter((x) => x.placement.before !== undefined && x.placement.after === undefined))
      place(f, region);
    result[region].push(e);
    for (const f of mine.filter((x) => x.placement.after !== undefined)) place(f, region);
  };
  anchors.forEach((e) => place(e, e.placement.region));
  return result;
}
