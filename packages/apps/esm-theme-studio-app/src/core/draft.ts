import type { ThemeStorage } from './library';
import type { StudioStore } from './store';
import type { StudioLevel, ThemeDoc } from './types';

export interface DraftData {
  doc: ThemeDoc;
  name: string;
  savedAt: string;
}
export interface Prefs {
  level: StudioLevel;
}

const safeParse = <T>(raw: string | null): T | null => {
  try {
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
};

/** Brouillon + préférences persistés : on ne perd pas son travail en changeant de page ou en rechargeant. */
export function createDraftPersistence(storage: ThemeStorage, prefix: string, now: () => Date = () => new Date()) {
  const draftKey = `${prefix}:draft`;
  const prefsKey = `${prefix}:prefs`;
  return {
    loadDraft: (): DraftData | null => {
      const d = safeParse<DraftData>(storage.getItem(draftKey));
      return d && typeof d.doc === 'object' && d.doc !== null && !Array.isArray(d.doc) ? d : null;
    },
    saveDraft: (doc: ThemeDoc, name: string) => storage.setItem(draftKey, JSON.stringify({ doc, name, savedAt: now().toISOString() } satisfies DraftData)),
    clearDraft: () => storage.removeItem(draftKey),
    loadPrefs: (): Partial<Prefs> => safeParse<Partial<Prefs>>(storage.getItem(prefsKey)) ?? {},
    savePrefs: (p: Prefs) => storage.setItem(prefsKey, JSON.stringify(p)),
  };
}
export type DraftPersistence = ReturnType<typeof createDraftPersistence>;

/** Enregistre automatiquement (anti-rebond) : brouillon si modifié, effacé sinon ; niveau toujours. Retourne `stop`. */
export function startAutosave(store: StudioStore, draft: DraftPersistence, delay = 400, timers: { set: typeof setTimeout; clear: typeof clearTimeout } = { set: setTimeout, clear: clearTimeout }) {
  let handle: ReturnType<typeof setTimeout> | undefined;
  const flush = () => {
    const s = store.getState();
    draft.savePrefs({ level: s.level });
    if (store.isDirty()) draft.saveDraft(s.doc, s.name);
    else draft.clearDraft();
  };
  const off = store.subscribe(() => {
    if (handle) timers.clear(handle);
    handle = timers.set(flush, delay);
  });
  return () => {
    off();
    if (handle) timers.clear(handle);
  };
}
