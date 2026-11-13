import { clone } from './path';
import type { ThemeDoc } from './types';

/** Stockage clé/valeur minimal : `localStorage` par défaut, backend tenant branchable plus tard (cahier §A7). */
export interface ThemeStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export interface StoredTheme {
  id: string;
  name: string;
  doc: ThemeDoc;
  updatedAt: string;
}

export function memoryStorage(): ThemeStorage {
  const m = new Map<string, string>();
  return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => void m.set(k, v), removeItem: (k) => void m.delete(k) };
}

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'theme';

/** Bibliothèque de thèmes : créer, modifier, dupliquer, supprimer, thème actif. */
export function createThemeLibrary(storage: ThemeStorage, prefix = 'egen-theme-studio', now: () => Date = () => new Date()) {
  const indexKey = `${prefix}:index`;
  const activeKey = `${prefix}:active`;
  const read = (): StoredTheme[] => {
    try {
      const raw = storage.getItem(indexKey);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };
  const write = (themes: StoredTheme[]) => storage.setItem(indexKey, JSON.stringify(themes));
  const uniqueId = (name: string, themes: StoredTheme[]) => {
    let id = slug(name);
    for (let n = 2; themes.some((t) => t.id === id); n++) id = `${slug(name)}-${n}`;
    return id;
  };

  return {
    list: read,
    get: (id: string) => read().find((t) => t.id === id),

    /** Crée un thème ; `id` renvoyé. */
    create(name: string, doc: ThemeDoc): StoredTheme {
      const themes = read();
      const theme = { id: uniqueId(name, themes), name, doc: clone(doc), updatedAt: now().toISOString() };
      write([...themes, theme]);
      return theme;
    },

    /** Enregistre (met à jour) un thème existant. */
    save(id: string, doc: ThemeDoc, name?: string): StoredTheme | undefined {
      const themes = read();
      const i = themes.findIndex((t) => t.id === id);
      if (i < 0) return undefined;
      const updated = { ...themes[i], name: name ?? themes[i].name, doc: clone(doc), updatedAt: now().toISOString() };
      themes[i] = updated;
      write(themes);
      return updated;
    },

    duplicate(id: string, name?: string): StoredTheme | undefined {
      const src = read().find((t) => t.id === id);
      return src ? this.create(name ?? `${src.name} (copie)`, src.doc) : undefined;
    },

    remove(id: string): boolean {
      const themes = read();
      const next = themes.filter((t) => t.id !== id);
      if (next.length === themes.length) return false;
      write(next);
      if (this.getActiveId() === id) storage.removeItem(activeKey);
      return true;
    },

    getActiveId: (): string | null => storage.getItem(activeKey),
    setActive(id: string | null) {
      if (id === null) storage.removeItem(activeKey);
      else if (read().some((t) => t.id === id)) storage.setItem(activeKey, id);
    },
  };
}

export type ThemeLibrary = ReturnType<typeof createThemeLibrary>;
