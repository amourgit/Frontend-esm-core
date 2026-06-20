// ============================================================================
//  @egen/esm-theme — Point d'entrée public
// ============================================================================

// Types
export type {
  ThemeSchema,
  ThemeEngineOptions,
  ThemeEngineState,
  LoadedTheme,
  ColorScale,
  SurfaceTokens,
  BorderTokens,
  GlassLayer,
  GlassTokenSet,
} from './types';

// Moteur principal
export { ThemeEngine } from './engine';

// Singleton global (utilisé par le shell)
export { setupThemeEngine, getThemeEngine, getThemeState, reloadTheme } from './singleton';

// Utilitaires bas niveau (utiles pour les outils de build, tests, storybook)
export { flattenToCssVars } from './flatten';
export { buildCssString, injectCssVarsToDocument, removeCssVarsFromDocument } from './inject';
export { loadHighestPriorityTheme } from './loader';
