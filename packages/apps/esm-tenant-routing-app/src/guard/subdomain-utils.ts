// =============================================================================
//  SUBDOMAIN UTILS — Détection et analyse des sous-domaines
//
//  Ces fonctions sont pures (pas d'effet de bord, pas de dépendance réseau).
//  Elles constituent la couche de détection bas-niveau du guard de routage.
//
//  La logique bas-niveau de dérivation hostname ↔ domaine racine vit dans
//  @egen/esm-tenant (utils/domain-utils.ts) — SOURCE UNIQUE partagée avec
//  esm-primary-navigation-app (sélecteur de tenant), pour éviter que les deux
//  apps divergent sur l'interprétation d'un même hostname. Ne pas
//  réimplémenter `inferRootDomain`/`isLocalhostOrIp` localement ici.
// =============================================================================

import { isLocalhostOrIp, inferRootDomain } from '@egen/esm-tenant';

export { isLocalhostOrIp, inferRootDomain, buildTenantSubdomainUrl } from '@egen/esm-tenant';

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
 * Analyse le hostname courant pour détecter la présence d'un sous-domaine
 * par rapport au domaine racine configuré.
 *
 * @param hostname  Le hostname à analyser (window.location.hostname)
 * @param rootDomain  Le domaine racine de référence. Si vide, inféré automatiquement
 *   (voir `inferRootDomain` — préférer une valeur explicite en production).
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

  const effectiveRoot = inferRootDomain(hostname, rootDomain);

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
 * buildLoginUrlWithTenant('/egen/spa/login', 'lycee-lb')
 * // → '/egen/spa/login?tenant=lycee-lb'
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
