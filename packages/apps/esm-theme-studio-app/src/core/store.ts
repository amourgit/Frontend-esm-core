import { generateScale, readableOn, toHex } from './color';
import { resolveTemplate, type ControlDef } from './catalog';
import { clone, diffPaths, getIn, isPlainObject, setIn, unsetIn } from './path';
import type { Mode, StudioLevel, ThemeDoc } from './types';

export interface Selection {
  category?: string;
  component?: string;
  variant?: string;
  state?: string;
}

export interface StudioState {
  name: string;
  /** Dernière version enregistrée/chargée : sert à calculer les overrides et l'état « modifié ». */
  base: ThemeDoc;
  doc: ThemeDoc;
  mode: Mode;
  level: StudioLevel;
  selection: Selection;
  canUndo: boolean;
  canRedo: boolean;
}

export interface SetValueOptions {
  /** Pour un token de composant : stocke `{ light, dark }` au lieu d'une valeur commune aux deux modes. */
  perMode?: boolean;
}

const HISTORY_LIMIT = 100;
const COALESCE_MS = 800;

/** Store d'édition sans dépendance (compatible `useSyncExternalStore`) : brouillon, undo/redo, niveaux. */
export function createStudioStore(initial: ThemeDoc, options: { name?: string; now?: () => number } = {}) {
  const now = options.now ?? Date.now;
  let past: ThemeDoc[] = [];
  let future: ThemeDoc[] = [];
  let lastEdit = { key: '', at: 0 };
  const listeners = new Set<() => void>();

  let state: StudioState = {
    name: options.name ?? (isPlainObject(initial.meta) && typeof initial.meta.name === 'string' ? initial.meta.name : 'Nouveau thème'),
    base: clone(initial),
    doc: clone(initial),
    mode: 'light',
    level: 'simple',
    selection: {},
    canUndo: false,
    canRedo: false,
  };

  const emit = (patch: Partial<StudioState>) => {
    state = { ...state, ...patch, canUndo: past.length > 0, canRedo: future.length > 0 };
    listeners.forEach((l) => l());
  };

  /** Applique un nouveau document en alimentant l'historique (coalescé pour les glissements de curseur). */
  const commit = (next: ThemeDoc, key: string) => {
    if (next === state.doc) return;
    const t = now();
    const coalesce = key !== '' && key === lastEdit.key && t - lastEdit.at < COALESCE_MS && past.length > 0;
    if (!coalesce) {
      past = [...past, state.doc].slice(-HISTORY_LIMIT);
    }
    future = [];
    lastEdit = { key, at: t };
    emit({ doc: next });
  };

  const modePath = (def: ControlDef, mode: Mode) => resolveTemplate(def.template, mode);

  const toStored = (current: unknown, value: string): unknown => (Array.isArray(current) ? value.split(',').map((s) => s.trim()).filter(Boolean) : value);

  return {
    getState: () => state,
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },

    /** Modifie un token. Pour un composant, `perMode` choisit entre valeur commune et `{light,dark}`. */
    setValue(def: ControlDef, value: string, opts: SetValueOptions = {}) {
      const path = modePath(def, state.mode);
      const current = getIn(state.doc, path);
      let next: ThemeDoc;
      if (def.modeStyle === 'leaf') {
        const mode = state.mode;
        if (isPlainObject(current) && ('light' in current || 'dark' in current)) {
          next = setIn(state.doc, [...path, mode], value);
        } else if (opts.perMode) {
          const common = typeof current === 'string' ? current : value;
          next = setIn(state.doc, path, { light: common, dark: common, [mode]: value });
        } else {
          next = setIn(state.doc, path, value);
        }
      } else {
        next = setIn(state.doc, path, toStored(current, value));
      }
      commit(next, def.id);
    },

    /** Couleur de référence d'une famille : régénère l'échelle 50→950 (et `onPrimary`/`onSecondary` si pertinent). */
    setScale(family: string, hex: string) {
      const norm = toHex(hex);
      const scale = norm ? generateScale(norm) : null;
      if (!norm || !scale) return false;
      let next = setIn(state.doc, ['colors', family], scale);
      if (family === 'primary') next = setIn(next, ['colors', 'onPrimary'], readableOn(norm));
      if (family === 'secondary') next = setIn(next, ['colors', 'onSecondary'], readableOn(norm));
      commit(next, `scale.${family}`);
      return true;
    },

    /** Remet un token à la valeur de base ; un token ajouté par le Studio disparaît du JSON. */
    resetValue(def: ControlDef) {
      const path = modePath(def, state.mode);
      const baseValue = getIn(state.base, path);
      commit(baseValue === undefined ? unsetIn(state.doc, path) : setIn(state.doc, path, clone(baseValue)), '');
    },

    resetAll() {
      commit(clone(state.base), '');
    },

    undo() {
      if (!past.length) return;
      const previous = past[past.length - 1];
      past = past.slice(0, -1);
      future = [state.doc, ...future];
      lastEdit = { key: '', at: 0 };
      emit({ doc: previous });
    },

    redo() {
      if (!future.length) return;
      const [nextDoc, ...rest] = future;
      past = [...past, state.doc];
      future = rest;
      lastEdit = { key: '', at: 0 };
      emit({ doc: nextDoc });
    },

    /** Charge un thème (import, duplication, sélection de bibliothèque) ; l'historique repart de zéro. */
    load(doc: ThemeDoc, name?: string) {
      past = [];
      future = [];
      lastEdit = { key: '', at: 0 };
      const nm = name ?? (isPlainObject(doc.meta) && typeof doc.meta.name === 'string' ? doc.meta.name : state.name);
      emit({ doc: clone(doc), base: clone(doc), name: nm });
    },

    /** Marque le brouillon comme enregistré (la base devient le brouillon courant). */
    markSaved() {
      emit({ base: clone(state.doc) });
    },

    rename(name: string) {
      emit({ name, doc: setIn(state.doc, ['meta'], { ...(isPlainObject(state.doc.meta) ? state.doc.meta : {}), name }) });
    },

    setMode: (mode: Mode) => emit({ mode }),
    setLevel: (level: StudioLevel) => emit({ level }),
    select: (selection: Selection) => emit({ selection }),

    isDirty: () => diffPaths(state.base, state.doc).length > 0,
    /** Tokens modifiés par rapport à la base (clés `a.b.c`). */
    changedPaths: () => diffPaths(state.base, state.doc),
  };
}

export type StudioStore = ReturnType<typeof createStudioStore>;
