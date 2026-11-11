import { type SiteInfo } from '../hooks/useSpacesSitesState';

/**
 * La chaîne de sites (racine → site) du site le PLUS PROFOND dont l'identifiant figure comme segment du chemin d'URL.
 * Les sites sont à plat (`parentId`) : la profondeur est illimitée, la remontée est itérative et ne boucle jamais
 * (un parent déjà vu interrompt la chaîne). Vide si le chemin ne désigne aucun site.
 */
export function findSiteChain(sites: SiteInfo[], pathname: string): SiteInfo[] {
  if (sites.length === 0) return [];
  const byId = new Map(sites.map((site) => [site.id, site]));
  const segments = new Set(pathname.toLowerCase().split('/').filter(Boolean));

  const chainOf = (site: SiteInfo): SiteInfo[] => {
    const chain: SiteInfo[] = [];
    const seen = new Set<string>();
    let current: SiteInfo | undefined = site;
    while (current && !seen.has(current.id)) {
      seen.add(current.id);
      chain.push(current);
      current = current.parentId ? byId.get(current.parentId) : undefined;
    }
    return chain.reverse();
  };

  let best: SiteInfo[] = [];
  for (const site of sites) {
    if (!segments.has(site.id.toLowerCase())) continue;
    const chain = chainOf(site);
    if (chain.length > best.length) best = chain;
  }
  return best;
}
