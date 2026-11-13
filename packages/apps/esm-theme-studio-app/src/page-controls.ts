import { visibleAt, type ControlDef } from './core/catalog';
import type { StudioLevel } from './core/types';
import { PAGES, type StudioPage } from './pages';

const CLAIMED = new Set(PAGES.flatMap((p) => (Array.isArray(p.categories) ? p.categories : [])));

/** Contrôles d'une page d'édition, filtrés par niveau (Simple ⊂ Avancé ⊂ Expert). */
export function controlsForPage(catalog: ControlDef[], page: StudioPage, level: StudioLevel): ControlDef[] {
  if (page.kind !== 'categories') return [];
  const globals = catalog.filter((d) => d.category !== 'components');
  if (page.categories === 'essentials') return globals.filter((d) => d.level === 'simple');
  if (page.categories === 'rest') return globals.filter((d) => !CLAIMED.has(d.category) && visibleAt(d, level));
  const cats = page.categories ?? [];
  return globals.filter((d) => cats.includes(d.category) && visibleAt(d, level));
}
