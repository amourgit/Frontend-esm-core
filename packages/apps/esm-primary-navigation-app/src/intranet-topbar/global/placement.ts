import { parseRegionId, type TopBarRegionId } from '../kit/regions';

// =============================================================================
//  PLACEMENT DES ÉLÉMENTS GLOBAUX — où chaque élément global s'affiche par défaut
//
//  C'est le SEUL endroit où le placement par défaut des éléments globaux est écrit. Le code des éléments
//  (`items.tsx`) ne connaît aucun niveau. Un déploiement peut déplacer n'importe quel élément vers n'importe
//  quelle région de n'importe quel niveau avec la config `topbar.placement` :
//
//      "topbar": { "placement": { "clock": "l3-right", "nav": "l1-center" } }
//
//  Une région invalide ou un identifiant inconnu est ignoré (avertissement console), jamais fatal.
//  Si le niveau visé n'est pas rendu (`topbar.levels`), le contenu s'affiche sur le niveau rendu inférieur le
//  plus proche (voir kit/levels.ts) : rien n'est perdu.
// =============================================================================

export const GLOBAL_ITEM_IDS = [
  'brand',
  'search',
  'language',
  'divider',
  'apps',
  'quick-access',
  'fullscreen',
  'theme',
  'user',
  'clock',
  'menu-panel',
  'nav',
] as const;

export type GlobalItemId = (typeof GLOBAL_ITEM_IDS)[number];

export interface ItemPlacement {
  region: TopBarRegionId;
  /** Ordre dans la région (croissant). */
  order: number;
}

/** Placement d'usine. */
export const DEFAULT_PLACEMENT: Readonly<Record<GlobalItemId, ItemPlacement>> = {
  brand: { region: 'l1-left', order: 0 },
  search: { region: 'l1-right', order: 0 },
  language: { region: 'l1-right', order: 10 },
  divider: { region: 'l1-right', order: 20 },
  apps: { region: 'l1-right', order: 30 },
  'quick-access': { region: 'l1-right', order: 40 },
  fullscreen: { region: 'l1-right', order: 60 },
  theme: { region: 'l1-right', order: 70 },
  user: { region: 'l1-right', order: 90 },
  clock: { region: 'l1-right', order: 100 },
  'menu-panel': { region: 'l1-right', order: 110 },
  nav: { region: 'l2-center', order: 0 },
};

const isGlobalItemId = (id: string): id is GlobalItemId => (GLOBAL_ITEM_IDS as readonly string[]).includes(id);

/** Une région de CONTENU valide (`l<N>-left|center|right`, N ≥ 1) : le calque `background` n'accueille pas d'éléments. */
export function isContentRegionId(value: unknown): value is TopBarRegionId {
  if (typeof value !== 'string') return false;
  const parsed = parseRegionId(value);
  return Boolean(parsed && parsed.region !== 'background' && parsed.level >= 1);
}

/**
 * Placement effectif : l'usine, puis les surcharges valides de la config. L'`order` d'usine est conservé
 * (un élément déplacé garde sa position relative). Fonction pure, testable.
 */
export function resolvePlacement(
  overrides: Readonly<Record<string, unknown>> | undefined,
  warn: (message: string) => void = (m) => console.warn(m),
): Record<GlobalItemId, ItemPlacement> {
  const result = { ...DEFAULT_PLACEMENT } as Record<GlobalItemId, ItemPlacement>;
  for (const [id, region] of Object.entries(overrides ?? {})) {
    if (!isGlobalItemId(id)) {
      warn(`[topbar] topbar.placement : élément inconnu « ${id} » (attendu : ${GLOBAL_ITEM_IDS.join(', ')}).`);
      continue;
    }
    if (!isContentRegionId(region)) {
      warn(
        `[topbar] topbar.placement : région invalide « ${String(region)} » pour « ${id} » (attendu : l<N>-left|center|right).`,
      );
      continue;
    }
    result[id] = { ...result[id], region };
  }
  return result;
}
