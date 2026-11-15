import { type NavItem } from '../components/shell/DropdownNavigation';

/** Route SPA de la page d'accueil : l'« Accueil » du fil d'Ariane, exclu de la liste des options. */
export const HOME_ROUTE = 'home';

const norm = (p: string) => p.replace(/^\/+|\/+$/g, '').toLowerCase();

export interface ActiveNav {
  section: NavItem;
  /** Libellé de l'entrée (menu) correspondant à la page, s'il y en a une. */
  entryLabel?: string;
  /** Vrai si la page courante est la route même de la section. */
  atSectionRoot: boolean;
}

/**
 * Trouve, dans l'arborescence construite depuis le slot, la section et l'entrée qui correspondent au
 * chemin courant, par la route la plus longue qui est le chemin ou l'un de ses préfixes. Repli : la
 * section dont l'identifiant est le premier segment du chemin. Aucune connaissance des apps.
 */
export function resolveActiveNav(items: NavItem[], pathname: string): ActiveNav | undefined {
  const path = norm(pathname);
  const matches = (route?: string) => {
    if (!route) return false;
    const r = norm(route);
    return r !== '' && (path === r || path.startsWith(`${r}/`));
  };

  interface Best {
    section: NavItem;
    entryLabel?: string;
    groupTitle?: string;
    length: number;
    /** Plusieurs entrées différentes de la même section pointent vers cette route. */
    shared: boolean;
  }
  let best: Best | undefined;
  const consider = (section: NavItem, route: string | undefined, entryLabel?: string, groupTitle?: string) => {
    if (!matches(route)) return;
    const length = norm(route as string).length;
    if (!best || length > best.length) {
      best = { section, entryLabel, groupTitle, length, shared: false };
    } else if (length === best.length && best.section === section && best.entryLabel !== entryLabel) {
      best.shared = true;
    }
  };

  for (const section of items) {
    consider(section, section.route);
    for (const sub of section.subMenus ?? []) {
      for (const entry of sub.items) consider(section, entry.route, entry.label, sub.title || undefined);
    }
  }
  if (best) {
    const found = best as Best;
    return {
      section: found.section,
      // Plusieurs entrées sur la même page : le libellé de leur colonne la décrit mieux qu'une seule d'entre elles.
      entryLabel: found.shared && found.groupTitle ? found.groupTitle : found.entryLabel,
      atSectionRoot: !!found.section.route && norm(found.section.route) === path,
    };
  }
  const first = path.split('/')[0];
  const byKey = items.find((i) => i.sectionKey && norm(i.sectionKey) === first);
  return byKey ? { section: byKey, atSectionRoot: false } : undefined;
}
