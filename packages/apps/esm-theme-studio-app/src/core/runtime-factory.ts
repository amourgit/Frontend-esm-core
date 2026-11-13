import * as esmTheme from '@egen-civitas/esm-theme';
import { createEsmThemeRuntime, selectRuntime, type EsmThemeApi, type ThemeRuntimePort } from './runtime';

/** Runtime réel branché sur le singleton `@egen-civitas/esm-theme` du shell. */
export function createRuntime(requested = 'esm-theme'): ThemeRuntimePort {
  const api: EsmThemeApi = {
    flattenToCssVars: (doc) => esmTheme.flattenToCssVars(doc),
    applyGlobalThemeOverride: (schema, options) => esmTheme.applyGlobalThemeOverride(schema as never, options),
    removeGlobalThemeOverride: (id) => esmTheme.removeGlobalThemeOverride(id),
    getThemeState: () => esmTheme.getThemeState() as ReturnType<EsmThemeApi['getThemeState']>,
    setThemeMode: (mode) => esmTheme.setThemeMode(mode),
    subscribe: (listener) => {
      try {
        return esmTheme.getThemeEngine().subscribe((s) => listener({ mode: s.mode }));
      } catch {
        return () => undefined; // moteur non initialisé (rendu isolé)
      }
    },
  };
  return selectRuntime(requested, createEsmThemeRuntime(api));
}
