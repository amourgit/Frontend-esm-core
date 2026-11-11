import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Building2, FolderTree } from 'lucide-react';
import { Combobox, showSnackbar, useConfig, type ComboboxItemData } from '@egen-civitas/esm-framework';
import { type ConfigSchema } from '../config-schema';
import { setActiveSite, useSpacesSites, type SiteNode } from '../store/spaces-sites.store';
import styles from '../context-selectors/context-selectors.scss';
import { goTo, goToSite } from './site-route';
import { getChildren, getSitePath, type SiteTree } from './site-tree';

interface CascadeLevel {
  depth: number;
  /** Site dont ce niveau liste les enfants ; `null` au premier niveau (les racines). */
  parent: SiteNode | null;
  items: SiteNode[];
  selected: SiteNode | null;
}

/**
 * Les niveaux à afficher pour le site actif : le premier liste les racines ; chaque site choisi qui a des enfants ouvre un
 * niveau de plus. Itératif et borné par la longueur du chemin du site actif : la profondeur de l'arbre est illimitée.
 */
export function buildCascadeLevels(tree: SiteTree, activeSiteId: string | null): CascadeLevel[] {
  const path = getSitePath(tree, activeSiteId);
  const levels: CascadeLevel[] = [];
  let parent: SiteNode | null = null;
  for (let depth = 0; ; depth++) {
    const items = getChildren(tree, parent?.id ?? null);
    if (items.length === 0) break;
    const selected = path[depth] ?? null;
    levels.push({ depth, parent, items, selected });
    if (!selected) break;
    parent = selected;
  }
  return levels;
}

/**
 * Sélecteur de site en CASCADE, de profondeur illimitée : une liste par niveau. Choisir un site qui a des sous-sites ouvre
 * la liste de ses enfants ; le site actif est le plus profond choisi (choisir « tous » à un niveau remonte d'un cran).
 */
export const SiteCascade: React.FC<{ tree: SiteTree }> = ({ tree }) => {
  const { t } = useTranslation();
  const { sites: sitesConfig } = useConfig<ConfigSchema>();
  const { siteId } = useSpacesSites();
  const levels = useMemo(() => buildCascadeLevels(tree, siteId), [tree, siteId]);
  if (levels.length === 0) return null;

  const handleChange = (level: CascadeLevel, value: string) => {
    // Le Combobox renvoie '' quand on re-sélectionne le site courant : c'est « tout ce niveau » (retour au parent).
    if (!value) {
      setActiveSite(level.parent?.id ?? null);
      if (!level.parent) {
        goTo(sitesConfig?.listRoute);
        showSnackbar({ isLowContrast: true, kind: 'info', title: t('siteFilterReset', 'Site filter reset') });
      }
      return;
    }
    const site = level.items.find((item) => item.id === value);
    setActiveSite(value);
    goToSite(sitesConfig?.route, value);
    if (site) {
      showSnackbar({
        isLowContrast: true,
        kind: 'success',
        title: t('siteActivated', 'Site activated: {{name}}', { name: site.name }),
      });
    }
  };

  return (
    <>
      {levels.map((level) => (
        <Combobox
          key={level.parent?.id ?? 'roots'}
          items={toComboboxItems(tree, level.items)}
          value={level.selected?.id ?? ''}
          onValueChange={(value: string) => handleChange(level, value)}
          placeholder={
            level.parent
              ? t('allOf', 'All of {{name}}', { name: level.parent.shortName || level.parent.name })
              : t('allSites', 'All sites')
          }
          searchPlaceholder={t('searchSite', 'Search a site...')}
          emptyMessage={t('noSiteFound', 'No site found.')}
          align="start"
          className={styles.selectorSite}
          aria-label={
            level.parent
              ? t('subsiteSelection', 'Sub-site selection (level {{level}})', { level: level.depth + 1 })
              : t('siteSelection', 'Site selection')
          }
        />
      ))}
    </>
  );
};

/** Items du Combobox, groupés par catégorie (les items d'un même groupe doivent être consécutifs : tri stable). */
function toComboboxItems(tree: SiteTree, sites: SiteNode[]): ComboboxItemData[] {
  return [...sites]
    .sort((a, b) => (a.category ?? '').localeCompare(b.category ?? '', 'fr'))
    .map((site) => {
      const hasChildren = getChildren(tree, site.id).length > 0;
      return {
        value: site.id,
        label: site.name,
        description: [site.shortName, site.category].filter(Boolean).join(' · ') || undefined,
        group: site.category || undefined,
        icon: hasChildren ? <FolderTree aria-hidden /> : <Building2 aria-hidden />,
        keywords: [site.shortName, site.category, site.description].filter((k): k is string => !!k),
      };
    });
}
