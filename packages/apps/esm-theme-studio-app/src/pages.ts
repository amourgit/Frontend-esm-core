// Pages d'édition du Studio. UNE source de vérité : `routes.json` (entrées de rail/TopBar) est vérifié contre cette liste
// par `pages.test.ts`. Seules les pages d'ÉDITION de TweakCN sont portées (éditeur, thèmes enregistrés) : ni accueil,
// ni tarifs, ni communauté, ni IA, ni compte/connexion (le shell EGEN gère l'identité).

export const APP_ROUTE = 'theme-studio';

export type PageKind = 'categories' | 'components' | 'library' | 'json';

export interface StudioPage {
  id: string;
  /** Segment d'URL après `theme-studio` ('' = page par défaut). */
  segment: string;
  label: string;
  description: string;
  icon: string;
  group: string;
  groupLabel: string;
  order: number;
  kind: PageKind;
  /** Catégories de tokens éditées ; `'essentials'` = contrôles de niveau Simple ; `'rest'` = tout ce qu'aucune autre page ne couvre. */
  categories?: string[] | 'essentials' | 'rest';
}

export const PAGES: StudioPage[] = [
  { id: 'essentials', segment: '', label: 'Essentiels', description: 'Couleurs de marque, fond, rayon et polices', icon: 'Sparkles', group: 'conception', groupLabel: 'Conception', order: 800, kind: 'categories', categories: 'essentials' },
  { id: 'colors', segment: 'couleurs', label: 'Couleurs', description: 'Marque, sémantique, surfaces et bordures', icon: 'Palette', group: 'conception', groupLabel: 'Conception', order: 810, kind: 'categories', categories: ['colors'] },
  { id: 'typography', segment: 'typographie', label: 'Typographie', description: 'Familles, tailles, graisses et espacement des lettres', icon: 'Type', group: 'conception', groupLabel: 'Conception', order: 820, kind: 'categories', categories: ['typography'] },
  { id: 'shapes', segment: 'formes', label: 'Formes & ombres', description: 'Rayons, ombres et espacements', icon: 'Box', group: 'conception', groupLabel: 'Conception', order: 830, kind: 'categories', categories: ['borderRadius', 'shadows', 'spacing'] },
  { id: 'layout', segment: 'mise-en-page', label: 'Mise en page', description: 'Dimensions du shell, rails et zones', icon: 'LayoutDashboard', group: 'conception', groupLabel: 'Conception', order: 840, kind: 'categories', categories: ['layout'] },
  { id: 'effects', segment: 'effets', label: 'Effets & animations', description: 'Flou, transitions et animations', icon: 'Zap', group: 'conception', groupLabel: 'Conception', order: 850, kind: 'categories', categories: ['effects', 'transitions', 'animation'] },
  { id: 'components', segment: 'composants', label: 'Composants', description: 'Variantes et états de chaque composant', icon: 'Blocks', group: 'composants', groupLabel: 'Composants', order: 860, kind: 'components' },
  { id: 'library', segment: 'bibliotheque', label: 'Mes thèmes', description: 'Enregistrer, ouvrir, dupliquer, importer et exporter', icon: 'Library', group: 'themes', groupLabel: 'Thèmes', order: 870, kind: 'library' },
  { id: 'rest', segment: 'autres', label: 'Autres tokens', description: 'Panels, z-index, icônes… (Expert)', icon: 'Settings2', group: 'avance', groupLabel: 'Avancé', order: 880, kind: 'categories', categories: 'rest' },
  { id: 'json', segment: 'json', label: 'JSON', description: 'Éditeur du thème complet (Expert)', icon: 'Braces', group: 'avance', groupLabel: 'Avancé', order: 890, kind: 'json' },
];

export const DEFAULT_PAGE = PAGES[0];

/** Segment après `theme-studio` dans l'URL ; `null` hors de l'app. */
export function segmentFromPath(pathname: string): string | null {
  const parts = pathname.split('/').filter(Boolean);
  const i = parts.indexOf(APP_ROUTE);
  return i < 0 ? null : (parts[i + 1] ?? '');
}

/** Page affichée pour une URL (segment inconnu → page par défaut). */
export function pageFromPath(pathname: string): StudioPage {
  const segment = segmentFromPath(pathname);
  return PAGES.find((p) => p.segment === (segment ?? '')) ?? DEFAULT_PAGE;
}

export const routeOf = (page: StudioPage): string => (page.segment ? `${APP_ROUTE}/${page.segment}` : APP_ROUTE);
