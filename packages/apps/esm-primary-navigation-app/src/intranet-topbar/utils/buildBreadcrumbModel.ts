import type React from 'react';
import { type NavItem } from '../components/shell/DropdownNavigation';
import { HOME_ROUTE, resolveActiveNav } from './resolveActiveNav';

// =============================================================================
//  MODÈLE DU FIL D'ARIANE (niveau 2 de la TopBar)
//
//  La navigation des apps est un arbre à 3 niveaux :
//
//      Espace (Intranet…)                      ← sélecteur du niveau 1, pas dans le fil
//        └─ Section        (Informations, Annuaire, Sites…)      niveau « section »
//             └─ Entrée    (À la Une, Contacts, Organigramme…)   niveau « entrée »
//
//  Le fil d'Ariane montre le CHEMIN de la page courante dans cet arbre :
//
//      Accueil  ›  Section  ›  Entrée
//
//  Règle unique, appliquée à chaque maillon : un maillon qui a des ALTERNATIVES à son niveau
//  (ses « frères » dans l'arbre) ouvre, au clic, un menu qui les liste ; la page courante y est
//  cochée.
//    • maillon « Section » → toutes les sections de l'espace ;
//    • maillon « Entrée »  → toutes les entrées de la même section (groupées par colonne).
//  Un maillon sans alternative est un simple lien (ou, s'il est le dernier, la page courante).
//
//  Ce module est PUR (aucun React, aucun effet) : il transforme l'arbre + le chemin en modèle.
// =============================================================================

/** Une alternative proposée dans le menu d'un maillon. */
export interface CrumbOption {
  key: string;
  label: string;
  description?: string;
  icon?: React.ElementType;
  /** Titre de la colonne d'origine (niveau « entrée »). */
  group?: string;
  /** Vrai pour la page / section actuellement affichée. */
  current: boolean;
  /** Absent : l'option n'a aucune destination (grisée). */
  onSelect?: () => void;
}

export interface Crumb {
  key: string;
  kind: 'home' | 'section' | 'entry' | 'next';
  label: string;
  /** Action du clic quand le maillon n'a pas d'alternatives (lien). */
  onSelect?: () => void;
  /** Alternatives du même niveau. Plus d'une → le maillon ouvre un menu. */
  options: CrumbOption[];
  /** Titre du menu. */
  menuTitle?: string;
}

export interface BreadcrumbModel {
  home: Crumb;
  /** Section courante (absente pour une page inconnue de l'arbre). */
  section?: Crumb;
  /** Entrée courante de la section (absente à la racine de la section ou pour une page non listée). */
  entry?: Crumb;
  /** Maillon « Sélectionner… » : les entrées de la section, quand on est à sa racine. */
  next?: Crumb;
  /** Vrai si la page courante est la route même de la section. */
  atSectionRoot: boolean;
}

/** Action de sélection d'une section : sa propre route, sinon sa première entrée (comportement déclaré par l'app). */
function sectionAction(item: NavItem): (() => void) | undefined {
  if (item.route && item.onClick) return item.onClick;
  return item.subMenus?.find((sub) => sub.items.length > 0)?.items[0]?.onClick;
}

export function buildBreadcrumbModel(
  navItems: NavItem[],
  pathname: string,
  deps: { goHome: () => void },
): BreadcrumbModel {
  const home: Crumb = { key: 'home', kind: 'home', label: 'Accueil', onSelect: deps.goHome, options: [] };

  // L'accueil est le premier maillon du fil : il n'est pas une « section » parmi les autres.
  const sections = navItems.filter((item) => item.route !== HOME_ROUTE);
  const active = resolveActiveNav(sections, pathname);
  if (!active) return { home, atSectionRoot: false };

  const section = active.section;
  const sectionCrumb: Crumb = {
    key: `section-${section.id}`,
    kind: 'section',
    label: section.label,
    onSelect: sectionAction(section),
    menuTitle: "Options de l'espace",
    options: sections.map((item) => ({
      key: `section-${item.id}`,
      label: item.label,
      current: item.id === section.id,
      onSelect: sectionAction(item),
    })),
  };

  // Entrées de la section (à plat, avec leur colonne d'origine).
  const entryOptions = (currentLabel?: string): CrumbOption[] =>
    (section.subMenus ?? []).flatMap((sub) =>
      sub.items.map((entry, index) => ({
        key: `entry-${section.id}-${sub.title}-${entry.entryName ?? entry.label}-${index}`,
        label: entry.label,
        description: entry.description,
        icon: entry.icon,
        group: sub.title || undefined,
        // `entryLabel` est le libellé de l'entrée, ou le titre de sa colonne si plusieurs entrées partagent la page.
        current: !!currentLabel && (entry.label === currentLabel || sub.title === currentLabel),
        onSelect: entry.onClick,
      })),
    );

  const allEntries = entryOptions(active.entryLabel);
  const hasEntries = allEntries.length > 0;
  const menuTitle = `Pages de ${section.label}`;

  const entry: Crumb | undefined =
    active.entryLabel && !active.atSectionRoot
      ? {
          key: `entry-${section.id}-${active.entryLabel}`,
          kind: 'entry',
          label: active.entryLabel,
          menuTitle,
          options: allEntries,
        }
      : undefined;

  const next: Crumb | undefined = hasEntries
    ? { key: `next-${section.id}`, kind: 'next', label: 'Sélectionner…', menuTitle, options: allEntries }
    : undefined;

  return { home, section: sectionCrumb, entry, next, atSectionRoot: active.atSectionRoot };
}
