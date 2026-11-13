import { parsePlacementShorthand, type TopBarContentRegion } from '../kit';

// =============================================================================
//  PLACEMENT DES ÉLÉMENTS GLOBAUX — où chaque élément global s'affiche par défaut
//
//  C'est le SEUL endroit où cette app DÉCLARE ses niveaux et le placement par défaut de ses éléments globaux. Le kit
//  de la TopBar ne connaît aucun niveau ; le code des éléments (`items.tsx`) non plus. Les niveaux `main` et
//  `navigation` sont créés ici comme n'importe quelle app crée le sien : une autre app peut y placer ses composants
//  (en les nommant dans `meta.topbar.level`) ou déclarer un tout autre niveau.
//
//  Un déploiement peut déplacer n'importe quel élément vers n'importe quel niveau avec la config `topbar.placement`
//  (`"<niveau>:<région>"`, le niveau est créé s'il n'existe pas) :
//
//      "topbar": { "placement": { "clock": "navigation:right", "nav": "main:center" } }
//
//  Une valeur invalide ou un identifiant inconnu est ignoré (avertissement console), jamais fatal. Si le niveau visé
//  n'est pas rendu (`topbar.levels`), le contenu s'affiche sur le niveau précédent de la pile (voir kit/levels.ts).
// =============================================================================

/** Niveaux déclarés par cette app, avec leur rang dans la pile. */
export const GLOBAL_LEVEL_RANKS: Readonly<Record<string, number>> = { main: 10, navigation: 20 };

export const GLOBAL_ITEM_IDS = [
  'search',
  'divider',
  'apps',
  'quick-access',
  'fullscreen',
  'theme',
  'clock',
  'menu-panel',
  'nav',
] as const;

export type GlobalItemId = (typeof GLOBAL_ITEM_IDS)[number];

export interface ItemPlacement {
  level: string;
  rank?: number;
  region: TopBarContentRegion;
  /** Ordre dans la région (croissant). */
  order: number;
}

const at = (level: string, region: TopBarContentRegion, order: number): ItemPlacement => ({
  level,
  rank: GLOBAL_LEVEL_RANKS[level],
  region,
  order,
});

/** Placement d'usine. */
export const DEFAULT_PLACEMENT: Readonly<Record<GlobalItemId, ItemPlacement>> = {
  search: at('main', 'right', 0),
  divider: at('main', 'right', 20),
  apps: at('main', 'right', 30),
  'quick-access': at('main', 'right', 40),
  fullscreen: at('main', 'right', 60),
  theme: at('main', 'right', 70),
  clock: at('main', 'right', 100),
  'menu-panel': at('main', 'right', 110),
  nav: at('navigation', 'center', 0),
};

const isGlobalItemId = (id: string): id is GlobalItemId => (GLOBAL_ITEM_IDS as readonly string[]).includes(id);

/**
 * Placement effectif : l'usine, puis les surcharges valides de la config. L'`order` d'usine est conservé
 * (un élément déplacé garde sa position relative). Fonction pure, testable.
 */
export function resolvePlacement(
  overrides: Readonly<Record<string, unknown>> | undefined,
  warn: (message: string) => void = (m) => console.warn(m),
): Record<GlobalItemId, ItemPlacement> {
  const result = { ...DEFAULT_PLACEMENT } as Record<GlobalItemId, ItemPlacement>;
  for (const [id, value] of Object.entries(overrides ?? {})) {
    if (!isGlobalItemId(id)) {
      warn(`[topbar] topbar.placement : élément inconnu « ${id} » (attendu : ${GLOBAL_ITEM_IDS.join(', ')}).`);
      continue;
    }
    const target = parsePlacementShorthand(value);
    if (!target) {
      warn(
        `[topbar] topbar.placement : valeur invalide « ${String(value)} » pour « ${id} » (attendu : <niveau>:left|center|right).`,
      );
      continue;
    }
    result[id] = { ...result[id], ...target, rank: GLOBAL_LEVEL_RANKS[target.level] };
  }
  return result;
}
