import { useEffect, useMemo, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useSession, useConfig, navigate, interpolateUrl } from '@egen-civitas/esm-framework';
import { useTenantMode, useTenant } from '@egen-civitas/esm-tenant';
import { analyzeSubdomain, buildLoginUrlWithTenant } from './subdomain-utils';
import { type ConfigSchema } from '../config-schema';

// =============================================================================
//  GARDE DE ROUTAGE TENANT — logique de décision (hook, sans JSX)
//
//  REFONTE DU 8 AOÛT 2026 — RÔLE STRICTEMENT RÉDUIT :
//  ────────────────────────────────────────────────────
//  Ce hook ne fait plus AUCUNE vérification de validité du tenant (existence
//  dans une registry, statut suspendu). Le sous-domaine capturé dans l'URL
//  est accepté tel quel — c'est le rôle du backend de décider s'il est
//  valide, via les réponses normales des appels API (401/403/404 gérés
//  comme des erreurs API classiques, pas ici).
//
//  Ce qui reste ICI est de la navigation pure, indépendante de la validité
//  du tenant :
//    1. Système "off" ou mode "single" → rien à faire, laisser passer.
//    2. Route publique (login, logout, home...) → laisser passer.
//    3. localhost / IP (dev sans domaine réel) → laisser passer.
//    4. Aucun sous-domaine dans l'URL (utilisateur sur le domaine racine)
//       → rediriger vers la landing globale (pas une "invalidation" du
//       tenant, juste une UX : il n'y a rien à afficher côté tenant ici).
//    5. Sous-domaine présent, utilisateur non authentifié → rediriger vers
//       /login avec le tenant en query param (login.component.tsx le
//       persiste ensuite via storeHeaderTenantId()).
//    6. Sous-domaine présent, authentifié → rien à faire, laisser l'app
//       s'afficher normalement.
//
//  Architecture en 2 hooks (inchangée depuis la version précédente) :
//    useTenantRouting()          → calcule la décision (pur, testable)
//    useTenantRoutingNavigator() → exécute le navigate() correspondant
// =============================================================================

export type RoutingAction = 'idle' | 'skip' | 'redirect-login' | 'redirect-global-landing';

export type RoutingDecision =
  | { action: 'idle' }
  | { action: 'skip'; reason: string }
  | { action: 'redirect-global-landing' }
  | { action: 'redirect-login'; tenantSlug: string };

const PUBLIC_ROUTE_SEGMENTS = ['login', 'logout'];

function isPublicRoute(pathname: string, skipRoutesRegex?: string): boolean {
  if (skipRoutesRegex) {
    try {
      if (new RegExp(skipRoutesRegex).test(pathname)) return true;
    } catch {
      // Regex invalide dans la config — ignorée silencieusement, on continue
      // avec les segments publics par défaut ci-dessous.
    }
  }

  const spaBase =
    typeof window !== 'undefined' && typeof window.getEgenSpaBase === 'function' ? window.getEgenSpaBase() : '';
  const relative = spaBase && pathname.startsWith(spaBase) ? pathname.slice(spaBase.length) : pathname;
  const firstSegment = relative.split('/').filter(Boolean)[0];

  return PUBLIC_ROUTE_SEGMENTS.includes(firstSegment ?? '');
}

/** Calcule la décision de routage courante (pur — ne navigue jamais). */
export function useTenantRouting(): RoutingDecision {
  const location = useLocation();
  const config = useConfig<ConfigSchema>();
  const tenantMode = useTenantMode();
  const tenantId = useTenant();
  const session = useSession();
  const isAuthenticated = Boolean(session?.authenticated);

  const analysis = useMemo(() => {
    if (typeof window === 'undefined') return null;
    return analyzeSubdomain(window.location.hostname, config.rootDomain);
  }, [config.rootDomain]);

  return useMemo<RoutingDecision>(() => {
    // 1. Système désactivé ou tenant forcé statiquement → rien à décider ici.
    if (tenantMode === 'off' || tenantMode === 'single') {
      return { action: 'idle' };
    }

    // 2. Route publique → laisser passer sans condition.
    if (isPublicRoute(location.pathname, config.skipRoutesRegex)) {
      return { action: 'skip', reason: 'public-route' };
    }

    if (!analysis) {
      return { action: 'idle' };
    }

    // 3. Dev / environnement sans domaine réel → laisser passer.
    if (analysis.isLocalhost) {
      return { action: 'skip', reason: 'localhost' };
    }

    // 4. Aucun sous-domaine dans l'URL → landing globale.
    if (!analysis.hasSubdomain) {
      return { action: 'redirect-global-landing' };
    }

    // 5. Sous-domaine présent (= un tenant est capturé, voir `tenantId`),
    //    mais utilisateur non authentifié → login, tenant transmis en query.
    if (!isAuthenticated) {
      return { action: 'redirect-login', tenantSlug: tenantId ?? analysis.subdomain! };
    }

    // 6. Sous-domaine présent + authentifié → rien à faire, l'app s'affiche.
    return { action: 'skip', reason: 'tenant-ok-authenticated' };
  }, [tenantMode, tenantId, location.pathname, analysis, isAuthenticated, config.skipRoutesRegex]);
}

/**
 * Exécute les navigate() en réaction aux décisions de useTenantRouting().
 * Séparé du hook de décision pour faciliter les tests unitaires.
 * Chaque décision n'est exécutée qu'une seule fois (navigatedRef).
 */
export function useTenantRoutingNavigator(decision: RoutingDecision, config: ConfigSchema): void {
  const navigatedRef = useRef<string>('');

  useEffect(() => {
    const key = JSON.stringify(decision);
    if (navigatedRef.current === key) return;

    switch (decision.action) {
      case 'idle':
      case 'skip':
        return; // Ne rien faire

      case 'redirect-global-landing': {
        navigatedRef.current = key;
        navigate({ to: interpolateUrl(config.landingPageUrl) });
        break;
      }

      case 'redirect-login': {
        navigatedRef.current = key;
        const loginBase = interpolateUrl(config.loginUrl);
        const urlWithTenant = buildLoginUrlWithTenant(loginBase, decision.tenantSlug);
        navigate({ to: urlWithTenant });
        break;
      }
    }
  }, [decision, config]);
}
