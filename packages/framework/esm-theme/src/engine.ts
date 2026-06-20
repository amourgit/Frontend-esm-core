// ============================================================================
//  EIGEN THEME ENGINE — Orchestrateur principal
// ============================================================================

import { loadHighestPriorityTheme } from './loader';
import { flattenToCssVars } from './flatten';
import { injectCssVarsToDocument, removeCssVarsFromDocument } from './inject';
import type {
  ThemeEngineOptions,
  ThemeEngineState,
  LoadedTheme,
} from './types';

const DEFAULT_OPTIONS: Required<
  Pick<ThemeEngineOptions, 'cssVarPrefix' | 'separator' | 'ignoreRootKeys' | 'pollIntervalMs' | 'targetSelector'>
> = {
  cssVarPrefix: '',
  separator: '-',
  ignoreRootKeys: ['priority', 'meta', 'tenant'],
  pollIntervalMs: 0,
  targetSelector: ':root',
};

/**
 * ThemeEngine — Moteur de thème dynamique EIGEN
 *
 * Charge des fichiers JSON de thème par URL, sélectionne le plus prioritaire,
 * aplatit ses tokens en variables CSS et les injecte dans le DOM.
 * Supporte le hot-reload par polling.
 *
 * @example
 * ```ts
 * const engine = new ThemeEngine({
 *   themeUrls: ['/themes/glass-dark.json', '/themes/custom.json'],
 *   pollIntervalMs: 3000, // hot-reload toutes les 3s
 * });
 * await engine.apply();
 * ```
 */
export class ThemeEngine {
  private readonly options: ThemeEngineOptions & typeof DEFAULT_OPTIONS;
  private state: ThemeEngineState = {
    status: 'idle',
    activeTheme: null,
    cssVarsCount: 0,
    error: null,
    lastApplied: null,
  };

  private pollTimer: ReturnType<typeof setInterval> | null = null;
  /** Empreinte du dernier thème appliqué pour détecter les changements en hot-reload */
  private lastThemeFingerprint: string | null = null;

  private readonly listeners = new Set<(state: ThemeEngineState) => void>();

  constructor(options: ThemeEngineOptions) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  // --------------------------------------------------------------------------
  // API publique
  // --------------------------------------------------------------------------

  /**
   * Charge et applique le thème le plus prioritaire.
   * Retourne les variables CSS générées.
   */
  async apply(): Promise<Record<string, string>> {
    this.setState({ status: 'loading', error: null });

    try {
      const loaded = await loadHighestPriorityTheme(this.options.themeUrls);

      if (!loaded) {
        throw new Error('Aucun thème valide trouvé parmi les URLs fournies.');
      }

      const cssVars = this.processTheme(loaded);

      this.setState({
        status: 'applied',
        activeTheme: loaded,
        cssVarsCount: Object.keys(cssVars).length,
        lastApplied: Date.now(),
        error: null,
      });

      this.options.onApplied?.(loaded, cssVars);

      // Activer le hot-reload si configuré
      if (this.options.pollIntervalMs > 0 && !this.pollTimer) {
        this.startPolling();
      }

      return cssVars;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.setState({ status: 'error', error: message });
      this.options.onError?.(err instanceof Error ? err : new Error(message));
      console.error('[eigen/esm-theme] ❌ Erreur lors de l\'application du thème:', message);
      return {};
    }
  }

  /**
   * Démarre le hot-reload par polling.
   * Appelé automatiquement si `pollIntervalMs > 0` dans les options.
   */
  startPolling(): void {
    if (this.pollTimer) return;

    const interval = this.options.pollIntervalMs;
    if (!interval || interval <= 0) return;

    if (process.env.NODE_ENV !== 'production') {
      console.log(`[eigen/esm-theme] 🔄 Hot-reload activé (polling toutes les ${interval}ms)`);
    }

    this.pollTimer = setInterval(async () => {
      try {
        const loaded = await loadHighestPriorityTheme(this.options.themeUrls);
        if (!loaded) return;

        const fingerprint = this.computeFingerprint(loaded);

        if (fingerprint !== this.lastThemeFingerprint) {
          if (process.env.NODE_ENV !== 'production') {
            console.log('[eigen/esm-theme] 🔥 Changement de thème détecté — rechargement à chaud');
          }
          const cssVars = this.processTheme(loaded);
          this.setState({
            status: 'applied',
            activeTheme: loaded,
            cssVarsCount: Object.keys(cssVars).length,
            lastApplied: Date.now(),
            error: null,
          });
          this.options.onApplied?.(loaded, cssVars);
        }
      } catch {
        // Erreur silencieuse en polling — on attend la prochaine itération
      }
    }, interval);
  }

  /**
   * Arrête le hot-reload.
   */
  stopPolling(): void {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
      if (process.env.NODE_ENV !== 'production') {
        console.log('[eigen/esm-theme] ⏹  Hot-reload désactivé');
      }
    }
  }

  /**
   * Retire les variables CSS du DOM et remet le moteur à zéro.
   */
  destroy(): void {
    this.stopPolling();
    removeCssVarsFromDocument();
    this.setState({
      status: 'idle',
      activeTheme: null,
      cssVarsCount: 0,
      error: null,
      lastApplied: null,
    });
    this.listeners.clear();
  }

  /**
   * Retourne une copie de l'état courant du moteur.
   */
  getState(): ThemeEngineState {
    return { ...this.state };
  }

  /**
   * Abonne un listener aux changements d'état.
   * Retourne une fonction de désabonnement.
   */
  subscribe(listener: (state: ThemeEngineState) => void): () => void {
    this.listeners.add(listener);
    // Émettre immédiatement l'état courant
    listener({ ...this.state });
    return () => this.listeners.delete(listener);
  }

  // --------------------------------------------------------------------------
  // Méthodes internes
  // --------------------------------------------------------------------------

  private processTheme(loaded: LoadedTheme): Record<string, string> {
    const cssVars = flattenToCssVars(loaded.schema as Record<string, unknown>, {
      prefix: this.options.cssVarPrefix,
      separator: this.options.separator,
      ignoreRootKeys: this.options.ignoreRootKeys,
    });

    injectCssVarsToDocument(cssVars, this.options.targetSelector);
    this.lastThemeFingerprint = this.computeFingerprint(loaded);

    return cssVars;
  }

  private setState(partial: Partial<ThemeEngineState>): void {
    this.state = { ...this.state, ...partial };
    for (const listener of this.listeners) {
      listener({ ...this.state });
    }
  }

  /**
   * Calcule une empreinte légère d'un thème chargé pour détecter les changements.
   * Utilise l'URL + priority + updatedAt (si disponible) pour éviter un JSON.stringify complet.
   */
  private computeFingerprint(loaded: LoadedTheme): string {
    const updatedAt = (loaded.schema.meta as Record<string, string>)?.updatedAt ?? '';
    return `${loaded.url}::${loaded.priority}::${updatedAt}`;
  }
}
