// =============================================================================
//  TOPBAR KIT — contrat des régions (neutre : aucune logique métier)
//
//  La TopBar est une grille de RÉGIONS. Chaque niveau (1 et 2) a trois régions :
//
//      l1-left | l1-center | l1-right      (niveau 1)
//      l2-left | l2-center | l2-right      (niveau 2)
//
//  Chaque région est alimentée de deux façons, sur le même pied d'égalité :
//   • les ÉLÉMENTS (`registerTopBarItem`) : composants du module global de cette app (langue, thème, recherche…) ;
//   • les EXTENSIONS d'apps : slot `topbar-<région>-slot` (ex. `topbar-l1-right-slot`), déclaré dans le
//     `routes.json` de n'importe quelle app (déployée, distante ou fédérée).
//
//  Une extension s'affiche si son app est active (une page montée) ou si elle déclare `meta.global: true`.
// =============================================================================

export type TopBarLevel = 1 | 2;
export type TopBarRegion = 'left' | 'center' | 'right';
export type TopBarRegionId = `l${TopBarLevel}-${TopBarRegion}`;

export const TOPBAR_REGION_IDS: readonly TopBarRegionId[] = [
  'l1-left',
  'l1-center',
  'l1-right',
  'l2-left',
  'l2-center',
  'l2-right',
];

/** Nom du slot d'extension d'une région (ex. `topbar-l1-right-slot`). */
export const topBarSlotName = (id: TopBarRegionId) => `topbar-${id}-slot`;

/** Slots historiques, toujours honorés (rendus dans la région équivalente). */
export const LEGACY_SLOTS: Readonly<Partial<Record<TopBarRegionId, readonly string[]>>> = {
  'l1-center': ['top-nav-info-slot'],
  'l1-right': ['top-nav-actions-slot', 'top-nav-trailing-slot'],
  'l2-left': ['top-nav-app-slot'],
  'l2-right': ['top-nav-level2-end-slot'],
};
