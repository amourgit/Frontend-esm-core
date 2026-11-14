import cuid from 'cuid';
import type { Theme, ThemeStyles } from '../types/theme';
import { ErrorCode, ThemeNotFoundError, ValidationError, actionError, actionSuccess } from '../types/errors';

// Bibliothèque de thèmes de l'utilisateur : stockage local (aucun serveur). Interface identique à l'original.
const KEY = 'egen:theme-studio:saved-themes';
const USER = 'egen-local-user';
export const MAX_THEMES = 500;

type Stored = Omit<Theme, 'createdAt' | 'updatedAt'> & { createdAt: string; updatedAt: string };

const load = (): Theme[] => {
  try {
    const raw = JSON.parse(window.localStorage.getItem(KEY) ?? '[]') as Stored[];
    return raw.map((t) => ({ ...t, createdAt: new Date(t.createdAt), updatedAt: new Date(t.updatedAt) }));
  } catch {
    return [];
  }
};
const save = (themes: Theme[]) => window.localStorage.setItem(KEY, JSON.stringify(themes));

export async function getThemes() {
  return load()
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .map((t) => ({ ...t, isPublished: false }));
}

export const getTheme = async (themeId: string): Promise<Theme> => {
  if (!themeId) throw new ValidationError('Theme ID required');
  const found = load().find((t) => t.id === themeId);
  if (!found) throw new ThemeNotFoundError('Theme not found');
  return found;
};

export async function createTheme(formData: { name: string; styles: ThemeStyles }) {
  const name = formData.name?.trim();
  if (!name || name.length > 50) return actionError(ErrorCode.VALIDATION_ERROR, 'Theme name must be 1–50 characters');
  const themes = load();
  const now = new Date();
  const created: Theme = { id: cuid(), userId: USER, name, styles: formData.styles, createdAt: now, updatedAt: now };
  save([...themes, created]);
  return actionSuccess(created);
}

export async function updateTheme(formData: { id: string; name?: string; styles?: ThemeStyles }) {
  const themes = load();
  const i = themes.findIndex((t) => t.id === formData.id);
  if (i < 0) throw new ThemeNotFoundError('Theme not found');
  const next: Theme = {
    ...themes[i],
    ...(formData.name ? { name: formData.name.trim() } : {}),
    ...(formData.styles ? { styles: formData.styles } : {}),
    updatedAt: new Date(),
  };
  themes[i] = next;
  save(themes);
  return next;
}

export async function deleteTheme(themeId: string) {
  const themes = load();
  const found = themes.find((t) => t.id === themeId);
  if (!found) throw new ThemeNotFoundError('Theme not found');
  save(themes.filter((t) => t.id !== themeId));
  return found;
}
