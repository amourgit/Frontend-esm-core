// Port vers le moteur de thème. Le Studio n'embarque AUCUN moteur de tokens (cahier §11, §24) :
// il pilote celui du framework. Aujourd'hui `esm-theme`, demain TokiForge (adaptateur côté framework, voir `registerThemeRuntime`).
import type { Mode, ThemeDoc } from './types';

export interface ApplyOptions {
  priority: number;
  id?: string;
}

export interface ThemeRuntimePort {
  readonly id: string;
  /** Variables CSS (`--colors-primary-500` → valeur) d'un thème pour un mode précis : alimente la prévisualisation scopée. */
  previewVars(doc: ThemeDoc, mode: Mode): Record<string, string>;
  /** Applique le thème à toute l'application, à chaud. */
  apply(doc: ThemeDoc, options: ApplyOptions): void;
  /** Retire le thème appliqué par le Studio (retour au thème du tenant/par défaut). */
  revert(): void;
  isApplied(): boolean;
  /** Thème actuellement actif dans l'environnement (point de départ du Studio). */
  getActiveTheme(): ThemeDoc | null;
  getMode(): Mode;
  setMode(mode: Mode): void;
  subscribeMode(listener: (mode: Mode) => void): () => void;
}

/** Sous-ensemble de l'API publique de `@egen-civitas/esm-theme` utilisé par le pont (injectable pour les tests). */
export interface EsmThemeApi {
  flattenToCssVars(doc: Record<string, unknown>): { base: Record<string, string>; light: Record<string, string>; dark: Record<string, string> };
  applyGlobalThemeOverride(schema: Record<string, unknown>, options?: { id?: string; priority?: number }): void;
  removeGlobalThemeOverride(id?: string): void;
  getThemeState(): { mode: Mode; activeTheme: { schema: unknown } | null } | null;
  setThemeMode(mode: Mode): void;
  subscribe?(listener: (state: { mode: Mode }) => void): () => void;
}

export const DEFAULT_OVERRIDE_ID = 'theme-studio';

export function createEsmThemeRuntime(api: EsmThemeApi, overrideId = DEFAULT_OVERRIDE_ID): ThemeRuntimePort {
  let applied = false;
  return {
    id: 'esm-theme',
    previewVars(doc, mode) {
      const { base, light, dark } = api.flattenToCssVars(doc);
      return { ...base, ...(mode === 'light' ? light : dark) };
    },
    apply(doc, options) {
      api.applyGlobalThemeOverride(doc, { id: options.id ?? overrideId, priority: options.priority });
      applied = true;
    },
    revert() {
      api.removeGlobalThemeOverride(overrideId);
      applied = false;
    },
    isApplied: () => applied,
    getActiveTheme() {
      const schema = api.getThemeState()?.activeTheme?.schema;
      return schema && typeof schema === 'object' ? (JSON.parse(JSON.stringify(schema)) as ThemeDoc) : null;
    },
    getMode: () => api.getThemeState()?.mode ?? 'light',
    setMode: (mode) => api.setThemeMode(mode),
    subscribeMode(listener) {
      return api.subscribe ? api.subscribe((s) => listener(s.mode)) : () => undefined;
    },
  };
}

// --- Sélection du runtime (esm-theme | tokiforge) ---------------------------------------------------------------
const registry = new Map<string, ThemeRuntimePort>();

/** Appelé par un adaptateur du framework (ex. TokiForge) pour se rendre disponible au Studio. */
export const registerThemeRuntime = (port: ThemeRuntimePort): void => void registry.set(port.id, port);
export const unregisterThemeRuntime = (id: string): void => void registry.delete(id);

/** Retourne le runtime demandé ; repli sur `fallback` (avec avertissement) si l'adaptateur n'est pas enregistré. */
export function selectRuntime(requested: string, fallback: ThemeRuntimePort, warn: (msg: string) => void = console.warn): ThemeRuntimePort {
  if (requested === fallback.id) return fallback;
  const found = registry.get(requested);
  if (found) return found;
  warn(`[theme-studio] Runtime « ${requested} » non enregistré — repli sur « ${fallback.id} ».`);
  return fallback;
}
