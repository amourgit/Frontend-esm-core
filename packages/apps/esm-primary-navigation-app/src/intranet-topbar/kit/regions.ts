// =============================================================================
//  TOPBAR KIT — contrat des niveaux et régions (neutre : aucune logique métier)
//
//  La TopBar est une pile de NIVEAUX numérotés 1, 2, 3… (1 = en haut). Le nombre de niveaux n'est pas figé :
//  il se déduit de ce qui est déclaré (voir levels.ts). Chaque niveau reproduit la même structure, trois régions :
//
//      l<N>-left  |  l<N>-center  |  l<N>-right          ex. l3-right = niveau 3, région droite
//
//  Une région est alimentée de deux façons, sur le même pied d'égalité :
//   • les ÉLÉMENTS (`registerTopBarItem`) : composants du module global de cette app ;
//   • les EXTENSIONS d'apps : slot `topbar-l<N>-<région>-slot` (ex. `topbar-l3-right-slot`) dans le `routes.json`
//     de n'importe quelle app (déployée, distante ou fédérée).
//
//  Chaque niveau a aussi un calque d'ARRIÈRE-PLAN : `l<N>-background` (slot `topbar-l<N>-background-slot`), derrière le
//  contenu, transparent par défaut. Une app y injecte ce qu'elle veut (dégradé, image, animation…).
//
//  Une extension s'affiche si son app est active (une page montée) ou si elle déclare `meta.global: true`.
// =============================================================================

/** Régions de CONTENU d'un niveau. */
export type TopBarContentRegion = 'left' | 'center' | 'right';
/** + `background` : calque d'arrière-plan du niveau (derrière le contenu, sans interaction). */
export type TopBarRegion = TopBarContentRegion | 'background';
export type TopBarRegionId = `l${number}-${TopBarRegion}`;

export const TOPBAR_REGIONS: readonly TopBarContentRegion[] = ['left', 'center', 'right'];

/** Plafond absolu du nombre de niveaux (garde-fou contre une déclaration erronée). */
export const TOPBAR_HARD_MAX_LEVELS = 12;

export const regionId = (level: number, region: TopBarRegion): TopBarRegionId => `l${level}-${region}`;

export function parseRegionId(id: string): { level: number; region: TopBarRegion } | null {
  const m = /^l(\d+)-(left|center|right|background)$/.exec(id);
  return m ? { level: Number(m[1]), region: m[2] as TopBarRegion } : null;
}

/** Nom du slot d'extension d'une région (ex. `topbar-l1-right-slot`). */
export const topBarSlotName = (id: TopBarRegionId) => `topbar-${id}-slot`;

/** Slots historiques, toujours honorés (rattachés à la région équivalente). */
export const LEGACY_SLOTS: Readonly<Record<string, readonly string[]>> = {
  'l1-center': ['top-nav-info-slot'],
  'l1-right': ['top-nav-actions-slot', 'top-nav-trailing-slot'],
  'l2-left': ['top-nav-app-slot'],
  'l2-right': ['top-nav-level2-end-slot'],
};

/** Tous les slots d'une région : le slot officiel puis les slots historiques. */
export const slotNamesFor = (id: TopBarRegionId): string[] => [topBarSlotName(id), ...(LEGACY_SLOTS[id] ?? [])];

const LEGACY_REVERSE: Record<string, TopBarRegionId> = Object.fromEntries(
  Object.entries(LEGACY_SLOTS).flatMap(([id, slots]) => slots.map((s) => [s, id as TopBarRegionId])),
);

/** Région d'un nom de slot (officiel ou historique) ; `null` si ce n'est pas un slot de la TopBar. */
export function regionOfSlot(slotName: string): TopBarRegionId | null {
  const m = /^topbar-(l\d+-(?:left|center|right|background))-slot$/.exec(slotName);
  return (m?.[1] as TopBarRegionId | undefined) ?? LEGACY_REVERSE[slotName] ?? null;
}
