import { isNavEntryInWorkspace, type NavEntryMeta } from '@egen-civitas/esm-framework';
import { type NavItem, type NavSubMenu, type NavSubMenuItem } from '../components/shell/DropdownNavigation';
import { resolveNavIcon } from '../data/navIcons';
import { type SlotNavEntry } from '../hooks/useSlotNavEntries';

type Translate = (key: string, defaultValue: string) => string;

/**
 * Visibilité d'une entrée dans un espace. Le shell est livré pré-compilé avec SA version du framework :
 * un shell antérieur à esm-framework 1.2 n'expose pas `isNavEntryInWorkspace`. On l'utilise quand il est là,
 * sinon on applique la même règle (absent, vide ou '*' = tous les espaces) plutôt que de faire planter la TopBar.
 */
function visibleInWorkspace(meta: NavEntryMeta, workspaceId: string): boolean {
  if (typeof isNavEntryInWorkspace === 'function') return isNavEntryInWorkspace(meta, workspaceId);
  const list = meta.workspaces;
  return !list || list.length === 0 || list.includes('*') || list.includes(workspaceId);
}

const stripSlashes = (route: string) => route.replace(/^\/+|\/+$/g, '');
const toLink = (route: string) => `/${stripSlashes(route)}`;

interface SectionDraft {
  key: string;
  label: string;
  /** Route du bouton de section (première `sectionRoute` rencontrée dans l'ordre du slot). */
  sectionRoute?: string;
  /** Colonnes dans l'ordre d'apparition ; la clé `''` désigne les entrées sans `group`. */
  groups: Map<string, { title: string; items: NavSubMenuItem[] }>;
  entries: SlotNavEntry[];
}

/**
 * Construit le niveau 2 de la TopBar à partir des SEULES entrées déclarées par les apps sur le slot
 * `topbar-level2-nav`. Aucune donnée codée en dur : sans déclaration, le niveau 2 est vide.
 *
 * - Filtrage par espace : une entrée n'est retenue que si `isNavEntryInWorkspace(meta, workspaceId)`.
 *   La section d'un espace est composée des seules entrées qui y sont visibles ; une section sans
 *   entrée visible n'apparaît pas.
 * - Ordre : celui du slot (`order` dans routes.json) ; les sections sont ordonnées par leur première entrée.
 * - Une app peut contribuer à la section d'une autre app (même `section`).
 * - Forme du bouton de section :
 *   - une seule entrée, sans `group` → bouton direct (lien, pas de menu) ;
 *   - sinon → menu déroulant ; les entrées sans `group` forment une colonne sans titre, en tête.
 *   - `sectionRoute` rend en plus le bouton de section cliquable (navigation) en plus de son menu.
 */
export function buildNavItemsFromSlot(entries: SlotNavEntry[], workspaceId: string, t: Translate): NavItem[] {
  const sections = new Map<string, SectionDraft>();

  for (const entry of entries) {
    const e = entry.meta;
    if (!visibleInWorkspace(e, workspaceId)) continue;

    let section = sections.get(e.section);
    if (!section) {
      section = {
        key: e.section,
        label: e.sectionLabelKey ? t(e.sectionLabelKey, e.sectionLabel ?? e.section) : e.sectionLabel ?? e.section,
        groups: new Map(),
        entries: [],
      };
      sections.set(e.section, section);
    }
    // Le libellé de la section vient de la première entrée qui en fournit un.
    if (section.label === e.section && (e.sectionLabel || e.sectionLabelKey)) {
      section.label = e.sectionLabelKey ? t(e.sectionLabelKey, e.sectionLabel ?? e.section) : e.sectionLabel ?? e.section;
    }
    if (!section.sectionRoute && e.sectionRoute) section.sectionRoute = stripSlashes(e.sectionRoute);
    section.entries.push(entry);

    const groupKey = e.group ?? '';
    let group = section.groups.get(groupKey);
    if (!group) {
      group = {
        title: !e.group ? '' : e.groupLabelKey ? t(e.groupLabelKey, e.groupLabel ?? e.group) : e.groupLabel ?? e.group,
        items: [],
      };
      section.groups.set(groupKey, group);
    }
    const route = stripSlashes(e.route);
    group.items.push({
      label: e.labelKey ? t(e.labelKey, e.label) : e.label,
      description: e.descriptionKey ? t(e.descriptionKey, e.description ?? '') : e.description,
      icon: resolveNavIcon(e.icon),
      link: toLink(route),
      route,
      entryName: entry.name,
    });
  }

  let nextId = 1;
  return [...sections.values()].map((section): NavItem => {
    const only = section.entries.length === 1 && !section.entries[0].meta.group ? section.entries[0] : undefined;
    if (only) {
      const route = section.sectionRoute ?? stripSlashes(only.meta.route);
      return {
        id: nextId++,
        label: section.label,
        sectionKey: section.key,
        entryName: only.name,
        route,
        link: toLink(route),
      };
    }
    // Colonne sans titre en tête, puis les colonnes nommées dans leur ordre d'apparition.
    const columns: NavSubMenu[] = [...section.groups.entries()]
      .sort(([a], [b]) => (a === '' ? -1 : b === '' ? 1 : 0))
      .map(([, g]) => ({ title: g.title, items: g.items }));
    return {
      id: nextId++,
      label: section.label,
      sectionKey: section.key,
      subMenus: columns,
      ...(section.sectionRoute ? { route: section.sectionRoute, link: toLink(section.sectionRoute) } : {}),
    };
  });
}
