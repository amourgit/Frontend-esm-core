import { useEffect, useMemo } from 'react';
import { useConfig, useExtensionSlotMeta } from '@egen-civitas/esm-framework';
import { type ConfigSchema } from '../config-schema';
import { setSites, type SiteNode } from '../store/spaces-sites.store';
import { buildSiteTree, isValidSite, mergeSiteSources, type SiteTree } from './site-tree';

/**
 * Slot de DONNÉES : une app y déclare un site par extension (composant qui ne rend rien), dans `meta.site` :
 * `{ "id": "dsi", "parentId": null, "name": "Direction des Systèmes d'Information", "shortName": "DSI" }`.
 */
export const SITES_REGISTRY_SLOT = 'sites-registry-slot';

/** Les sites déclarés par les apps : `meta.site` de chaque extension du slot ; les déclarations invalides sont ignorées. */
export function sitesFromDeclarations(declared: Record<string, unknown> | undefined): SiteNode[] {
  return Object.values(declared ?? {})
    .map((meta) => (meta as { site?: unknown } | null)?.site)
    .filter(isValidSite);
}

/** Les sites de la configuration du déploiement (les champs vides sont ignorés). */
export function sitesFromConfig(items: ConfigSchema['sites']['items'] | undefined): SiteNode[] {
  return (items ?? []).filter(isValidSite).map(({ parentId, shortName, category, description, order, ...site }) => ({
    ...site,
    ...(parentId ? { parentId } : {}),
    ...(shortName ? { shortName } : {}),
    ...(category ? { category } : {}),
    ...(description ? { description } : {}),
    ...(order ? { order } : {}),
  }));
}

/**
 * Le registre des sites : déclarations des apps + configuration du déploiement (la config complète/remplace, par
 * identifiant). Publie le résultat dans le store partagé pour les autres apps, et signale les anomalies corrigées.
 */
export function useSiteRegistry(): { tree: SiteTree; sites: SiteNode[] } {
  const { sites: sitesConfig } = useConfig<ConfigSchema>();
  const declared = useExtensionSlotMeta<unknown>(SITES_REGISTRY_SLOT);

  const sites = useMemo(
    () => mergeSiteSources(sitesFromDeclarations(declared), sitesFromConfig(sitesConfig?.items)),
    [declared, sitesConfig?.items],
  );
  const tree = useMemo(() => buildSiteTree(sites), [sites]);

  useEffect(() => {
    tree.warnings.forEach((warning) => console.warn(`[spaces-sites] ${warning}`));
  }, [tree]);

  useEffect(() => {
    setSites(sites);
  }, [sites]);

  return { tree, sites };
}
