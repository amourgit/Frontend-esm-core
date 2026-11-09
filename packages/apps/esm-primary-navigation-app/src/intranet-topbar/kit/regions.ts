// =============================================================================
//  TOPBAR KIT — contrat neutre des niveaux et des régions (aucune logique métier, aucun niveau nommé ici)
//
//  La TopBar est une pile de NIVEAUX. Un niveau n'est ni numéroté ni nommé par la TopBar : il EXISTE parce qu'une
//  app (ou un élément global) le DÉCLARE, avec le nom qu'elle choisit (`primary`, `promo`, `agenda`…). Plusieurs apps
//  peuvent déclarer le même niveau : leurs composants s'assemblent alors dans CE niveau (il est créé une seule fois).
//
//  Tous les niveaux ont le même squelette, trois régions (aucun n'est un cas particulier) :
//
//      left  |  center  |  right
//
//  plus un calque d'ARRIÈRE-PLAN (`background`), derrière le contenu, transparent par défaut.
//
//  UN SEUL slot d'extension : `topbar-slot`. Chaque extension y déclare son PLACEMENT dans `meta.topbar` :
//
//      { "name": "ma-banniere", "slot": "topbar-slot", "component": "banner",
//        "meta": { "topbar": { "level": "promo", "rank": 40, "region": "center", "order": 10 } } }
//
//  Voir placement.ts pour la forme complète (`before` / `after` : position par référence à une autre extension).
// =============================================================================

/** Le seul slot d'extension de la TopBar : les apps y attachent leurs composants et déclarent leur placement. */
export const TOPBAR_SLOT = 'topbar-slot';

/** Régions de CONTENU d'un niveau. */
export type TopBarContentRegion = 'left' | 'center' | 'right';
/** + `background` : calque d'arrière-plan du niveau (derrière le contenu, sans interaction). */
export type TopBarRegion = TopBarContentRegion | 'background';

export const TOPBAR_REGIONS: readonly TopBarContentRegion[] = ['left', 'center', 'right'];
export const TOPBAR_ALL_REGIONS: readonly TopBarRegion[] = [...TOPBAR_REGIONS, 'background'];

/** Plafond absolu du nombre de niveaux rendus (garde-fou contre une déclaration erronée). */
export const TOPBAR_HARD_MAX_LEVELS = 12;

/** Identifiant de niveau : minuscules, chiffres et tirets, commence par une lettre (ex. `primary`, `promo-ete`). */
export const LEVEL_ID_PATTERN = /^[a-z][a-z0-9-]{0,47}$/;
export const isLevelId = (value: unknown): value is string => typeof value === 'string' && LEVEL_ID_PATTERN.test(value);

export const isRegion = (value: unknown): value is TopBarRegion =>
  typeof value === 'string' && (TOPBAR_ALL_REGIONS as readonly string[]).includes(value);
export const isContentRegion = (value: unknown): value is TopBarContentRegion =>
  typeof value === 'string' && (TOPBAR_REGIONS as readonly string[]).includes(value);

/** Clé d'une région d'un niveau : `<niveau>:<région>` (ex. `primary:right`). */
export type TopBarRegionKey = `${string}:${TopBarRegion}`;
export const regionKey = (level: string, region: TopBarRegion): TopBarRegionKey => `${level}:${region}`;

export function parseRegionKey(key: unknown): { level: string; region: TopBarRegion } | null {
  if (typeof key !== 'string') return null;
  const i = key.lastIndexOf(':');
  if (i < 1) return null;
  const level = key.slice(0, i);
  const region = key.slice(i + 1);
  return isLevelId(level) && isRegion(region) ? { level, region } : null;
}
