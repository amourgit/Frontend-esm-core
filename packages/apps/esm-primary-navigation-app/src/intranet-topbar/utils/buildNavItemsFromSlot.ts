import { type NavEntryMeta } from '@egen-civitas/esm-framework';
import { type NavItem, type NavSubMenu } from '../components/shell/DropdownNavigation';
import { resolveNavIcon } from '../data/navIcons';

type Translate = (key: string, defaultValue: string) => string;

/**
 * Transforme les entrées déclarées par les apps (slot `topbar-level2-nav`) en
 * `NavItem[]` pour le niveau 2 de la TopBar.
 *
 * - `entries` doit déjà être trié par `order` (c'est l'ordre du slot).
 * - Entrée de niveau 2 = `section` ; colonne du méga-menu = `group`.
 * - Repli : une section absente du slot garde les `baseItems` actuels ; une
 *   section présente remplace les `subMenus` de l'item de même route, ou est
 *   ajoutée à la fin si elle n'existe pas dans `baseItems`.
 */
export function buildNavItemsFromSlot(baseItems: NavItem[], entries: NavEntryMeta[], t: Translate): NavItem[] {
  if (entries.length === 0) return baseItems;

  const sections = new Map<
    string,
    { label: string; groups: Map<string, { title: string; items: NavSubMenu['items'] }> }
  >();

  for (const e of entries) {
    let section = sections.get(e.section);
    if (!section) {
      section = {
        label: e.sectionLabelKey ? t(e.sectionLabelKey, e.sectionLabel ?? e.section) : (e.sectionLabel ?? e.section),
        groups: new Map(),
      };
      sections.set(e.section, section);
    }
    let group = section.groups.get(e.group);
    if (!group) {
      group = {
        title: e.groupLabelKey ? t(e.groupLabelKey, e.groupLabel ?? e.group) : (e.groupLabel ?? e.group),
        items: [],
      };
      section.groups.set(e.group, group);
    }
    group.items.push({
      label: e.labelKey ? t(e.labelKey, e.label) : e.label,
      description: e.descriptionKey ? t(e.descriptionKey, e.description ?? '') : e.description,
      icon: resolveNavIcon(e.icon),
      link: `/${e.route.replace(/^\/+/, '')}`,
    });
  }

  const result = baseItems.map((item) => {
    const key = (item.link ?? '').replace(/^\/+/, '').split('/')[0];
    const section = sections.get(key);
    if (!section) return item;
    sections.delete(key);
    return { ...item, subMenus: [...[...section.groups.values()].map((g) => ({ title: g.title, items: g.items }))] };
  });

  let nextId = Math.max(0, ...baseItems.map((i) => i.id)) + 1;
  for (const [key, section] of sections) {
    result.push({
      id: nextId++,
      label: section.label,
      link: `/${key}`,
      subMenus: [...section.groups.values()].map((g) => ({ title: g.title, items: g.items })),
    });
  }
  return result;
}
