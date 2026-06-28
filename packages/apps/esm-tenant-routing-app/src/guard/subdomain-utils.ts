// =============================================================================
//  SUBDOMAIN UTILS — Détection et analyse des sous-domaines
//
//  Ces fonctions sont pures (pas d'effet de bord, pas de dépendance réseau).
//  Elles constituent la couche de détection bas-niveau du guard de routage.
// =============================================================================

/**
 * Résultat de l'analyse d'un hostname vis-à-vis du domaine racine.
 */
export interface SubdomainAnalysis {
  /** Le hostname complet analysé */
  hostname: string;
  /** Domaine racine de référence utilisé */
  rootDomain: string;
  /** true si le hostname est exactement le rootDomain (sans sous-domaine) */
  isRootDomain: boolean;
  /** true si un sous-domaine a été détecté */
  hasSubdomain: boolean;
  /** Le sous-domaine extrait (ex: "lycee-lb"), ou null */
  subdomain: string | null;
  /** true si l'environnement est localhost/IP (développement) */
  isLocalhost: boolean;
}

/**
 * Hôtes qui sont toujours considérés comme "localhost" (pas de logique tenant).
 */
const LOCALHOST_HOSTNAMES = new Set(['localhost', '127.0.0.1', '0.0.0.0', '::1']);

/**
 * Détermine si un hostname est un localhost ou une IP privée.
 */
export function isLocalhostOrIp(hostname: string): boolean {
  if (LOCALHOST_HOSTNAMES.has(hostname)) return true;
  // IPv4 : 192.168.x.x, 10.x.x.x, 172.16-31.x.x
  if (/^(\d{1,3}\.){3}\d{1,3}$/.test(hostname)) return true;
  return false;
}

/**
 * Déduit le domaine racine depuis le hostname courant si aucun rootDomain
 * n'est configuré explicitement.
 *
 * Règle : retire le premier segment du hostname.
 * Ex: "lycee-lb.eigen.gabon.gov.ga" → "eigen.gabon.gov.ga"
 *
 * Pour les domaines simples (ex: "eigen.gabon.gov.ga" sans sous-domaine),
 * retourne le hostname lui-même.
 *
 * ATTENTION : cette heuristique est imprécise pour les TLD multi-niveaux
 * (gov.ga, co.uk…). Il est fortement recommandé de configurer `rootDomain`
 * explicitement en production.
 */
export function inferRootDomain(hostname: string): string {
  const parts = hostname.split('.');
  // Pour un domaine de type "a.b.c.d", le root est "b.c.d"
  // Pour un domaine de type "a.b", le root est "a.b" (aucun sous-domaine)
  if (parts.length <= 2) return hostname;
  return parts.slice(1).join('.');
}

/**
 * Analyse le hostname courant pour détecter la présence d'un sous-domaine
 * par rapport au domaine racine configuré.
 *
 * @param hostname  Le hostname à analyser (window.location.hostname)
 * @param rootDomain  Le domaine racine de référence. Si vide, inféré automatiquement.
 */
export function analyzeSubdomain(hostname: string, rootDomain: string): SubdomainAnalysis {
  const isLocalhost = isLocalhostOrIp(hostname);

  // En localhost : pas de logique tenant
  if (isLocalhost) {
    return {
      hostname,
      rootDomain: hostname,
      isRootDomain: true,
      hasSubdomain: false,
      subdomain: null,
      isLocalhost: true,
    };
  }

  const effectiveRoot = rootDomain.trim() || inferRootDomain(hostname);

  // Le hostname est-il exactement le root domain ?
  const isRootDomain = hostname === effectiveRoot;

  if (isRootDomain) {
    return {
      hostname,
      rootDomain: effectiveRoot,
      isRootDomain: true,
      hasSubdomain: false,
      subdomain: null,
      isLocalhost: false,
    };
  }

  // Vérifier que le hostname se termine bien par le root domain
  const suffix = '.' + effectiveRoot;
  if (!hostname.endsWith(suffix)) {
    // Hostname inconnu / hors du root domain — traité comme root domain
    return {
      hostname,
      rootDomain: effectiveRoot,
      isRootDomain: true,
      hasSubdomain: false,
      subdomain: null,
      isLocalhost: false,
    };
  }

  // Extraire le sous-domaine : tout ce qui précède ".rootDomain"
  const subdomainPart = hostname.slice(0, hostname.length - suffix.length);

  // Valider : le sous-domaine ne doit pas lui-même contenir de points
  // (si oui, c'est un sous-sous-domaine — on prend quand même le premier segment)
  const firstSegment = subdomainPart.split('.')[0];

  return {
    hostname,
    rootDomain: effectiveRoot,
    isRootDomain: false,
    hasSubdomain: !!firstSegment,
    subdomain: firstSegment || null,
    isLocalhost: false,
  };
}

/**
 * Construit l'URL de login avec le tenant injecté en query param (fallback)
 * quand le système de sous-domaine ne peut pas rediriger directement.
 *
 * @example
 * buildLoginUrlWithTenant('/eigen/spa/login', 'lycee-lb')
 * // → '/eigen/spa/login?tenant=lycee-lb'
 */
export function buildLoginUrlWithTenant(loginUrl: string, tenantSlug: string): string {
  try {
    const url = new URL(loginUrl, window.location.origin);
    url.searchParams.set('tenant', tenantSlug);
    return url.pathname + url.search;
  } catch {
    const separator = loginUrl.includes('?') ? '&' : '?';
    return `${loginUrl}${separator}tenant=${encodeURIComponent(tenantSlug)}`;
  }
}

/**
 * Construit l'URL complète du sous-domaine tenant.
 *
 * @example
 * buildTenantSubdomainUrl('lycee-lb', 'eigen.gabon.gov.ga', '/eigen/spa/home')
 * // → 'https://lycee-lb.eigen.gabon.gov.ga/eigen/spa/home'
 */
export function buildTenantSubdomainUrl(tenantSlug: string, rootDomain: string, path: string): string {
  const protocol = window.location.protocol;
  const port = window.location.port ? `:${window.location.port}` : '';
  return `${protocol}//${tenantSlug}.${rootDomain}${port}${path}`;
}
