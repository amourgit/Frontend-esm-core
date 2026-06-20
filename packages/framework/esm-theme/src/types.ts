// ============================================================================
//  EGEN THEME ENGINE — Types publics
// ============================================================================

/** Structure d'une palette de couleurs (50→950) */
export interface ColorScale {
  '50': string;
  '100': string;
  '200': string;
  '300': string;
  '400': string;
  '500': string;
  '600': string;
  '700': string;
  '800': string;
  '900': string;
  '950': string;
}

/** Valeurs de surface (light ou dark) */
export interface SurfaceTokens {
  background: string;
  foreground: string;
  card: string;
  cardForeground: string;
  popover: string;
  popoverForeground: string;
  muted: string;
  mutedForeground: string;
  accent: string;
  accentForeground: string;
  sidebar: string;
  sidebarForeground: string;
  header: string;
  headerForeground: string;
  overlay: string;
  skeleton: string;
  destructive: string;
  destructiveForeground: string;
  glass: string;
  glassBorder: string;
  glassHover: string;
}

/** Tokens de bordure */
export interface BorderTokens {
  default: string;
  input: string;
  ring: string;
  focus: string;
  divider: string;
  glass: string;
}

/** Couche glass pour un composant ou une taille */
export interface GlassLayer {
  background: string;
  backdropFilter: string;
  border: string;
  boxShadow: string;
}

/** Ensemble complet des couches glass (light ou dark) */
export interface GlassTokenSet {
  xs: GlassLayer;
  sm: GlassLayer;
  md: GlassLayer;
  lg: GlassLayer;
  xl: GlassLayer;
  sidebar: GlassLayer;
  header: GlassLayer;
  modal: GlassLayer;
  card: GlassLayer;
  dropdown: GlassLayer;
  toast: GlassLayer;
}

/** Schéma complet d'un fichier thème JSON */
export interface ThemeSchema {
  /** Priorité — seul le fichier avec la valeur la plus haute est appliqué */
  priority: number;

  meta?: {
    name?: string;
    version?: string;
    author?: string;
    description?: string;
    tenantId?: string;
    createdAt?: string;
    updatedAt?: string;
  };

  tenant?: Record<string, unknown>;

  colors?: {
    primary?: ColorScale;
    secondary?: ColorScale;
    neutral?: ColorScale;
    success?: ColorScale;
    warning?: ColorScale;
    error?: ColorScale;
    info?: ColorScale;
    surface?: {
      light?: Partial<SurfaceTokens>;
      dark?: Partial<SurfaceTokens>;
    };
    border?: {
      light?: Partial<BorderTokens>;
      dark?: Partial<BorderTokens>;
    };
  };

  glass?: {
    light?: Partial<GlassTokenSet>;
    dark?: Partial<GlassTokenSet>;
  };

  typography?: Record<string, unknown>;
  spacing?: Record<string, unknown>;
  layout?: Record<string, unknown>;
  borderRadius?: Record<string, unknown>;
  shadows?: Record<string, unknown>;
  animation?: Record<string, unknown>;
  transitions?: Record<string, unknown>;
  effects?: Record<string, unknown>;
  zIndex?: Record<string, unknown>;
  icons?: Record<string, unknown>;
  components?: Record<string, unknown>;

  [key: string]: unknown;
}

/** Un fichier thème chargé + ses métadonnées de chargement */
export interface LoadedTheme {
  url: string;
  priority: number;
  schema: ThemeSchema;
}

/** Options de configuration du ThemeEngine */
export interface ThemeEngineOptions {
  /**
   * Liste de URLs (absolues ou relatives) pointant vers des fichiers JSON de thème.
   * Le moteur les charge tous, compare les priorités, et applique le gagnant.
   */
  themeUrls: string[];

  /**
   * Préfixe des variables CSS générées. "" -> "--colors-primary-500"
   * @default ""
   */
  cssVarPrefix?: string;

  /**
   * Séparateur entre segments de clés imbriquées.
   * @default "-"
   */
  separator?: string;

  /**
   * Clés racines ignorées lors du flatten (ne génèrent pas de variables CSS).
   * @default ["priority", "meta", "tenant"]
   */
  ignoreRootKeys?: string[];

  /**
   * Active le hot-reload via polling (en ms). 0 = désactivé.
   * @default 0
   */
  pollIntervalMs?: number;

  /**
   * Sélecteur CSS cible pour l'injection des variables.
   * @default ":root"
   */
  targetSelector?: string;

  /**
   * Callback appelé après chaque application réussie d'un thème.
   */
  onApplied?: (theme: LoadedTheme, cssVars: Record<string, string>) => void;

  /**
   * Callback appelé en cas d'erreur de chargement.
   */
  onError?: (err: Error) => void;
}

/** État courant du moteur (observable via l'API publique) */
export interface ThemeEngineState {
  status: 'idle' | 'loading' | 'applied' | 'error';
  activeTheme: LoadedTheme | null;
  cssVarsCount: number;
  error: string | null;
  lastApplied: number | null;
}
