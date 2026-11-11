import { type SiteNode } from '../store/spaces-sites.store';

// =============================================================================
//  ARBRE DES SITES — profondeur ILLIMITÉE
//
//  Les sites sont déclarés À PLAT : chacun référence son parent par `parentId`. Aucune structure imbriquée à maintenir,
//  aucune limite de profondeur, et plusieurs sources (config, apps) peuvent contribuer au même arbre.
//  Toutes les fonctions sont itératives (pas de récursion : une chaîne de 100 000 niveaux ne fait pas déborder la pile)
//  et tolérantes : une donnée incohérente est corrigée et signalée, jamais fatale.
// =============================================================================

export interface SiteTree {
  /** Sites valides, indexés par identifiant. */
  byId: Map<string, SiteNode>;
  /** Enfants par parent (`null` = racines), triés par `order` puis par nom. */
  childrenOf: Map<string | null, SiteNode[]>;
  /** Parent EFFECTIF de chaque site (après correction des références cassées ou circulaires). */
  parentOf: Map<string, string | null>;
  /** Anomalies corrigées (doublon, parent introuvable, boucle), pour `console.warn`. */
  warnings: string[];
}

const isNonEmptyString = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0;

export function isValidSite(value: unknown): value is SiteNode {
  const site = value as SiteNode;
  return !!site && isNonEmptyString(site.id) && isNonEmptyString(site.name);
}

const compareSites = (a: SiteNode, b: SiteNode) =>
  (a.order ?? 0) - (b.order ?? 0) || a.name.localeCompare(b.name, 'fr');

/** Fusionne des sources de sites : en cas d'identifiant commun, la source SUIVANTE complète/remplace la précédente. */
export function mergeSiteSources(...sources: SiteNode[][]): SiteNode[] {
  const merged = new Map<string, SiteNode>();
  for (const source of sources) {
    for (const site of source) merged.set(site.id, { ...merged.get(site.id), ...site });
  }
  return Array.from(merged.values());
}

export function buildSiteTree(sites: SiteNode[]): SiteTree {
  const warnings: string[] = [];
  const byId = new Map<string, SiteNode>();
  for (const site of sites) {
    if (byId.has(site.id)) warnings.push(`site « ${site.id} » déclaré plusieurs fois : la première déclaration est conservée`);
    else byId.set(site.id, site);
  }

  const parentOf = new Map<string, string | null>();
  for (const site of byId.values()) {
    const parent = isNonEmptyString(site.parentId) ? site.parentId : null;
    if (parent === site.id) {
      warnings.push(`site « ${site.id} » est son propre parent : il devient une racine`);
      parentOf.set(site.id, null);
    } else if (parent !== null && !byId.has(parent)) {
      warnings.push(`site « ${site.id} » : parent « ${parent} » introuvable, il devient une racine`);
      parentOf.set(site.id, null);
    } else {
      parentOf.set(site.id, parent);
    }
  }

  // Boucles (A → B → A) : on remonte depuis chaque site ; au premier site revu dans la même remontée, on coupe le lien.
  for (const start of byId.keys()) {
    const walked = new Set<string>();
    let current: string | null = start;
    while (current !== null) {
      if (walked.has(current)) {
        warnings.push(`boucle dans les sites au niveau de « ${current} » : il devient une racine`);
        parentOf.set(current, null);
        break;
      }
      walked.add(current);
      current = parentOf.get(current) ?? null;
    }
  }

  const childrenOf = new Map<string | null, SiteNode[]>();
  for (const site of byId.values()) {
    const parent = parentOf.get(site.id) ?? null;
    const siblings = childrenOf.get(parent);
    if (siblings) siblings.push(site);
    else childrenOf.set(parent, [site]);
  }
  childrenOf.forEach((siblings) => siblings.sort(compareSites));

  return { byId, childrenOf, parentOf, warnings };
}

/** Enfants directs d'un site (`null` : les racines). */
export function getChildren(tree: SiteTree, parentId: string | null): SiteNode[] {
  return tree.childrenOf.get(parentId) ?? [];
}

/** Chemin de la racine jusqu'au site (inclus). Vide si le site est inconnu. */
export function getSitePath(tree: SiteTree, id: string | null): SiteNode[] {
  const path: SiteNode[] = [];
  let current: string | null = id;
  while (current !== null) {
    const site = tree.byId.get(current);
    if (!site) return [];
    path.push(site);
    current = tree.parentOf.get(current) ?? null;
  }
  return path.reverse();
}

/** Le site le PLUS PROFOND dont l'identifiant figure comme segment d'un chemin d'URL ; `undefined` s'il n'y en a pas. */
export function findSiteInPathname(tree: SiteTree, pathname: string): SiteNode | undefined {
  const segments = new Set(pathname.toLowerCase().split('/').filter(Boolean));
  let best: { site: SiteNode; depth: number } | undefined;
  for (const site of tree.byId.values()) {
    if (!segments.has(site.id.toLowerCase())) continue;
    const depth = getSitePath(tree, site.id).length;
    if (!best || depth > best.depth) best = { site, depth };
  }
  return best?.site;
}
