// ============================================================================
//  EGEN THEME ENGINE — Orchestrateur principal
// ============================================================================

import { loadHighestPriorityTheme } from './loader';
import { flattenToCssVars } from './flatten';
import {
  injectCssVarsToDocument,
  removeCssVarsFromDocument,
  injectScopedCssVars,
  removeScopedCssVars,
  applyModeAttribute,
} from './inject';
import { mergeBySortedPriority } from './deepMerge';
import type {
  ThemeEngineOptions,
  ThemeEngineState,
  LoadedTheme,
  ThemeMode,
  ThemeSchema,
  AppThemeOverride,
  FlattenResult,
} from './types';

const DEFAULT_OPTIONS: Required<
  Pick<
    ThemeEngineOptions,
    | 'cssVarPrefix'
    | 'separator'
    | 'ignoreRootKeys'
    | 'pollIntervalMs'
    | 'targetSelector'
    | 'defaultMode'
    | 'modeStorageKey'
  >
> = {
  cssVarPrefix: '',
  separator: '-',
  ignoreRootKeys: ['priority', 'meta', 'tenant'],
  pollIntervalMs: 0,
  targetSelector: ':root',
  defaultMode: 'dark',
  modeStorageKey: 'egen-theme-mode',
};

/**
 * ThemeEngine — Moteur de thème dynamique EGEN
 *
 * Charge des fichiers JSON de thème par URL, sélectionne le plus prioritaire,
 * résout le mode clair/sombre, aplatit ses tokens en variables CSS et les
 * injecte dans le DOM. Supporte le hot-reload par polling ainsi que des
 * surcharges scopées par application, avec fusion par priorité.
 *
 * @example
 * ```ts
 * const engine = new ThemeEngine({
 *   themeUrls: ['/themes/theme.default.json', '/themes/tenant.json'],
 *   pollIntervalMs: 3000, // hot-reload toutes les 3s
 * });
 * await engine.apply();
 *
 * // Une app peut surcharger son propre scope, sans toucher au reste :
 * engine.applyAppOverride('mon-app', { colors: { primary: { '500': '#16a34a' } } });
 * ```
 */
export class ThemeEngine {
  private readonly options: ThemeEngineOptions & typeof DEFAULT_OPTIONS;
  private state: ThemeEngineState = {
    status: 'idle',
    activeTheme: null,
    mode: 'dark',
    cssVarsCount: 0,
    error: null,
    lastApplied: null,
    activeOverrideScopes: [],
  };

  private pollTimer: ReturnType<typeof setInterval> | null = null;
  /** Empreinte du dernier thème appliqué pour détecter les changements en hot-reload */
  private lastThemeFingerprint: string | null = null;

  private readonly listeners = new Set<(state: ThemeEngineState) => void>();

  /** Surcharges enregistrées par scope (ex: nom d'app) → liste ordonnée par priorité */
  private readonly overrides = new Map<string, AppThemeOverride[]>();

  constructor(options: ThemeEngineOptions) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
    this.state.mode = this.resolveInitialMode();
  }

  // --------------------------------------------------------------------------
  // API publique — cycle de vie du thème global
  // --------------------------------------------------------------------------

  /**
   * Charge et applique le thème le plus prioritaire.
   * Retourne les variables CSS générées (groupées par base/light/dark).
   */
  async apply(): Promise<FlattenResult> {
    this.setState({ status: 'loading', error: null });

    try {
      const loaded = await loadHighestPriorityTheme(this.options.themeUrls);

      if (!loaded) {
        throw new Error('Aucun thème valide trouvé parmi les URLs fournies.');
      }

      const cssVars = this.processTheme(loaded);

      applyModeAttribute(this.state.mode);

      this.setState({
        status: 'applied',
        activeTheme: loaded,
        cssVarsCount:
          Object.keys(cssVars.base).length + Object.keys(cssVars.light).length + Object.keys(cssVars.dark).length,
        lastApplied: Date.now(),
        error: null,
      });

      this.options.onApplied?.(loaded, cssVars);

      // Ré-appliquer les surcharges existantes par-dessus le nouveau thème global
      for (const scope of this.overrides.keys()) {
        this.recomputeOverride(scope);
      }

      if (this.options.pollIntervalMs > 0 && !this.pollTimer) {
        this.startPolling();
      }

      return cssVars;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.setState({ status: 'error', error: message });
      this.options.onError?.(err instanceof Error ? err : new Error(message));
      console.error("[egen/esm-theme] ❌ Erreur lors de l'application du thème:", message);
      return { base: {}, light: {}, dark: {} };
    }
  }

  startPolling(): void {
    if (this.pollTimer) return;

    const interval = this.options.pollIntervalMs;
    if (!interval || interval <= 0) return;

    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.log(`[egen/esm-theme] 🔄 Hot-reload activé (polling toutes les ${interval}ms)`);
    }

    this.pollTimer = setInterval(async () => {
      try {
        const loaded = await loadHighestPriorityTheme(this.options.themeUrls);
        if (!loaded) return;

        const fingerprint = this.computeFingerprint(loaded);

        if (fingerprint !== this.lastThemeFingerprint) {
          if (process.env.NODE_ENV !== 'production') {
            // eslint-disable-next-line no-console
            console.log('[egen/esm-theme] 🔥 Changement de thème détecté — rechargement à chaud');
          }
          const cssVars = this.processTheme(loaded);
          this.setState({
            status: 'applied',
            activeTheme: loaded,
            cssVarsCount:
              Object.keys(cssVars.base).length + Object.keys(cssVars.light).length + Object.keys(cssVars.dark).length,
            lastApplied: Date.now(),
            error: null,
          });
          this.options.onApplied?.(loaded, cssVars);
          for (const scope of this.overrides.keys()) {
            this.recomputeOverride(scope);
          }
        }
      } catch {
        // Erreur silencieuse en polling — on attend la prochaine itération
      }
    }, interval);
  }

  stopPolling(): void {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
      if (process.env.NODE_ENV !== 'production') {
        // eslint-disable-next-line no-console
        console.log('[egen/esm-theme] ⏹  Hot-reload désactivé');
      }
    }
  }

  /**
   * Retire toutes les variables CSS (globales + surcharges) du DOM et remet
   * le moteur à zéro.
   */
  destroy(): void {
    this.stopPolling();
    removeCssVarsFromDocument();
    for (const scope of this.overrides.keys()) {
      removeScopedCssVars(scope);
    }
    this.overrides.clear();
    this.setState({
      status: 'idle',
      activeTheme: null,
      cssVarsCount: 0,
      error: null,
      lastApplied: null,
      activeOverrideScopes: [],
    });
    this.listeners.clear();
  }

  getState(): ThemeEngineState {
    return { ...this.state, activeOverrideScopes: [...this.state.activeOverrideScopes] };
  }

  subscribe(listener: (state: ThemeEngineState) => void): () => void {
    this.listeners.add(listener);
    listener(this.getState());
    return () => this.listeners.delete(listener);
  }

  // --------------------------------------------------------------------------
  // API publique — mode clair / sombre
  // --------------------------------------------------------------------------

  getMode(): ThemeMode {
    return this.state.mode;
  }

  /**
   * Change le mode actif (clair/sombre). Persisté en localStorage si
   * `modeStorageKey` n'est pas `null`. Aucune ré-injection de variables
   * n'est nécessaire : les deux jeux de variables (light + dark) sont déjà
   * présents dans le DOM, seul l'attribut `data-theme` change — donc c'est
   * instantané et ne provoque pas de flash.
   */
  setMode(mode: ThemeMode): void {
    if (mode === this.state.mode) return;
    this.state.mode = mode;
    applyModeAttribute(mode);
    if (this.options.modeStorageKey && typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(this.options.modeStorageKey, mode);
      } catch {
        // localStorage indisponible (mode privé, quota...) — non bloquant
      }
    }
    this.options.onModeChanged?.(mode);
    this.setState({});
  }

  toggleMode(): void {
    this.setMode(this.state.mode === 'dark' ? 'light' : 'dark');
  }

  // --------------------------------------------------------------------------
  // API publique — surcharges par application, avec priorité
  // --------------------------------------------------------------------------

  /**
   * Enregistre (ou met à jour) une surcharge de thème scopée à une
   * application. Le scope sert à la fois de clé d'enregistrement et de
   * sélecteur CSS d'injection : `[data-egen-app="<scope>"]`.
   *
   * Plusieurs surcharges peuvent coexister sur le même scope (ex: une
   * surcharge "tenant" à priority=5 et une surcharge "préférence
   * utilisateur" à priority=10) — elles sont fusionnées en profondeur dans
   * l'ordre des priorités, la plus haute gagnant clé par clé.
   *
   * @param scope Nom du scope (en général le nom de l'app, ex: "egen-academique")
   * @param schema Schéma de thème partiel (deep partial — ne déclarer que ce qu'on surcharge)
   * @param options.id Identifiant de cette surcharge précise au sein du scope (par défaut "default")
   * @param options.priority Priorité de fusion (par défaut 0)
   */
  applyAppOverride(
    scope: string,
    schema: Partial<ThemeSchema>,
    options: { id?: string; priority?: number } = {},
  ): void {
    const id = options.id ?? 'default';
    const priority = options.priority ?? 0;

    const existing = this.overrides.get(scope) ?? [];
    const next = [...existing.filter((o) => o.id !== id), { id, priority, schema }];
    this.overrides.set(scope, next);

    this.recomputeOverride(scope);
  }

  /**
   * Retire une surcharge précise d'un scope (ou tout le scope si `id` est omis).
   */
  removeAppOverride(scope: string, id?: string): void {
    if (id === undefined) {
      this.overrides.delete(scope);
      removeScopedCssVars(scope);
    } else {
      const existing = this.overrides.get(scope);
      if (!existing) return;
      const next = existing.filter((o) => o.id !== id);
      if (next.length === 0) {
        this.overrides.delete(scope);
        removeScopedCssVars(scope);
      } else {
        this.overrides.set(scope, next);
        this.recomputeOverride(scope);
      }
    }

    this.setState({ activeOverrideScopes: [...this.overrides.keys()] });
  }

  /** Liste les surcharges actuellement enregistrées pour un scope (debug/inspection). */
  getAppOverrides(scope: string): AppThemeOverride[] {
    return [...(this.overrides.get(scope) ?? [])];
  }

  // --------------------------------------------------------------------------
  // Méthodes internes
  // --------------------------------------------------------------------------

  private resolveInitialMode(): ThemeMode {
    if (typeof document !== 'undefined') {
      const existingAttr = document.documentElement.getAttribute('data-theme');
      if (existingAttr === 'light' || existingAttr === 'dark') return existingAttr;
    }

    if (this.options.modeStorageKey !== null && typeof window !== 'undefined') {
      try {
        const stored = window.localStorage.getItem(this.options.modeStorageKey ?? DEFAULT_OPTIONS.modeStorageKey);
        if (stored === 'light' || stored === 'dark') return stored;
      } catch {
        // ignore
      }
    }

    if (typeof window !== 'undefined' && window.matchMedia) {
      const prefersLight = window.matchMedia('(prefers-color-scheme: light)').matches;
      if (prefersLight) return 'light';
    }

    return this.options.defaultMode;
  }

  private processTheme(loaded: LoadedTheme): FlattenResult {
    const cssVars = flattenToCssVars(loaded.schema as Record<string, unknown>, {
      prefix: this.options.cssVarPrefix,
      separator: this.options.separator,
      ignoreRootKeys: this.options.ignoreRootKeys,
    });

    injectCssVarsToDocument(cssVars, this.options.targetSelector);
    this.lastThemeFingerprint = this.computeFingerprint(loaded);

    return cssVars;
  }

  /**
   * Recalcule la surcharge CSS effective d'un scope : fusion par priorité
   * croissante de toutes les surcharges enregistrées sur ce scope, puis
   * flatten + injection scopée.
   */
  private recomputeOverride(scope: string): void {
    const entries = this.overrides.get(scope);
    if (!entries || entries.length === 0) {
      removeScopedCssVars(scope);
      return;
    }

    const merged = mergeBySortedPriority<Partial<ThemeSchema>>({}, entries);

    const cssVars = flattenToCssVars(merged as Record<string, unknown>, {
      prefix: this.options.cssVarPrefix,
      separator: this.options.separator,
      ignoreRootKeys: this.options.ignoreRootKeys,
    });

    injectScopedCssVars(`[data-egen-app='${scope}']`, cssVars, scope);

    this.setState({ activeOverrideScopes: [...this.overrides.keys()] });
  }

  private setState(partial: Partial<ThemeEngineState>): void {
    this.state = { ...this.state, ...partial };
    for (const listener of this.listeners) {
      listener(this.getState());
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
