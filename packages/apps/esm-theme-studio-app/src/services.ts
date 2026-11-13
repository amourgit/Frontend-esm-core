import { createDraftPersistence, startAutosave } from './core/draft';
import { createThemeLibrary, memoryStorage, type ThemeStorage } from './core/library';
import type { ThemeRuntimePort } from './core/runtime';
import { createStudioStore } from './core/store';
import type { ThemeDoc } from './core/types';
import type { StudioConfig } from './config-schema';
import type { StudioServices } from './studio/studio-context';

export type StartedFrom = 'draft' | 'active' | 'empty';
export interface ServicesBundle extends StudioServices {
  startedFrom: StartedFrom;
}

let cache: { key: string; bundle: ServicesBundle } | null = null;

const EMPTY: ThemeDoc = { priority: 1, meta: { name: 'Nouveau thème' } };

function browserStorage(): ThemeStorage {
  try {
    const ls = window.localStorage;
    ls.setItem('__egen_probe__', '1');
    ls.removeItem('__egen_probe__');
    return ls;
  } catch {
    return memoryStorage(); // navigation privée / stockage bloqué : le Studio reste utilisable
  }
}

/**
 * Services du Studio, créés UNE fois par session de page : quitter l'app puis y revenir (changement de route du shell)
 * retrouve le même store, donc le même brouillon, le même niveau et l'état « appliqué ».
 */
export function getStudioServices(config: StudioConfig, deps: { runtime: ThemeRuntimePort; storage?: ThemeStorage }): ServicesBundle {
  const key = `${config.runtime}|${config.storageKey}|${config.applyPriority}`;
  if (cache?.key === key) return cache.bundle;

  const storage = deps.storage ?? browserStorage();
  const runtime = deps.runtime;
  const draft = createDraftPersistence(storage, config.storageKey);
  const library = createThemeLibrary(storage, config.storageKey);

  const active = runtime.getActiveTheme();
  const base = active ?? EMPTY;
  const store = createStudioStore(base);
  store.setMode(runtime.getMode());

  let startedFrom: StartedFrom = active ? 'active' : 'empty';
  const saved = draft.loadDraft();
  if (saved) {
    store.load(saved.doc, saved.name, base);
    startedFrom = 'draft';
  }
  const prefs = draft.loadPrefs();
  if (prefs.level) store.setLevel(prefs.level);

  startAutosave(store, draft);
  // Le mode d'édition suit le mode de l'application (l'inverse n'est jamais vrai : éditer ne change pas l'application).
  runtime.subscribeMode((m) => store.setMode(m));

  const bundle: ServicesBundle = { store, runtime, library, applyPriority: config.applyPriority, startedFrom };
  cache = { key, bundle };
  return bundle;
}

export const resetStudioServices = (): void => {
  cache = null;
};
