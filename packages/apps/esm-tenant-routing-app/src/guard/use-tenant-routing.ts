import { useEffect, useRef, useState, Suspense } from 'react';
import { useSession, useConfig, navigate, interpolateUrl } from '@egen/esm-framework';
import {
  useTenantMode,
  useTenantStatus,
  useTenant,
  getTenantByDomain,
} from '@egen/esm-tenant';
import { analyzeSubdomain, buildLoginUrlWithTenant } from './subdomain-utils';
import { type ConfigSchema } from '../config-schema';

// =============================================================================
//  USE TENANT ROUTING — Logique de routage multi-tenant
//
//  NOTE sur useSession() :
//    Ce hook utilise Suspense — il throw une Promise si la session n'est
//    pas encore chargée, et retourne directement un objet Session (jamais
//    null/undefined) une fois résolu.
//    Il NE retourne PAS { session, isLoading } — il retourne Session.
//    La gestion du "loading" est donc gérée par la limite Suspense du
//    composant parent (TenantRoutingGuard wrappé dans <Suspense>).
//
//  ┌─────────────────────────────────────────────────────────────────────┐
//  │  Mode tenant = 'off' ou 'single'                                    │
//  │    → Pas d'intervention, on laisse Single-SPA gérer le routing.     │
//  ├─────────────────────────────────────────────────────────────────────┤
//  │  Mode tenant = 'multi'                                               │
//  │  1. Route exemptée → skip                                           │
//  │  2. Analyser le hostname                                            │
//  │     a. Localhost/IP → skip (dev)                                    │
//  │     b. Root domain (pas de sous-domaine) → /home (landing)         │
//  │     c. Sous-domaine connu → continuer                              │
//  │     d. Sous-domaine inconnu → /home ou /tenant-suspended           │
//  │  3. Tenant résolu                                                   │
//  │     a. Suspendu → /tenant-suspended                                │
//  │     b. Non connecté → /login?tenant=slug                           │
//  │     c. Connecté → /home (dashboard)                                │
//  └─────────────────────────────────────────────────────────────────────┘
// =============================================================================

export type RoutingDecision =
  | { action: 'idle' }
  | { action: 'skip'; reason: string }
  | { action: 'redirect-landing'; reason: string }
  | { action: 'redirect-login'; tenantSlug: string }
  | { action: 'redirect-dashboard'; tenantSlug: string }
  | { action: 'redirect-suspended'; tenantSlug: string; message?: string }
  | { action: 'error-unknown-tenant'; slug: string };

/** true si la route courante est dans la liste des routes exemptées */
function isSkippedRoute(skipRegex: string): boolean {
  const path = window.location.pathname;
  const spaBase = window.getEgenSpaBase?.() ?? '/';
  const relativePath = path.startsWith(spaBase)
    ? path.slice(spaBase.length).replace(/^\//, '')
    : path.replace(/^\//, '');
  try {
    return new RegExp(skipRegex, 'i').test(relativePath);
  } catch {
    return false;
  }
}

// =============================================================================
//  useTenantRouting — Hook de décision (pur, testable)
//  Ce hook est appelé depuis le composant interne qui est déjà dans
//  la limite Suspense, donc useSession() peut throw en toute sécurité.
// =============================================================================
export function useTenantRouting(): RoutingDecision {
  const config = useConfig<ConfigSchema>();
  const tenantMode = useTenantMode();
  const tenantStatus = useTenantStatus();
  const activeTenant = useTenant();

  // useSession() utilise Suspense — throw une Promise si pas encore chargé.
  // Le composant parent (TenantRoutingGuard) wrappe ce hook dans <Suspense>
  // pour gérer le cas "session en cours de chargement".
  const session = useSession();

  // ── 1. Système tenant désactivé ou mode single → skip ────────────────────
  if (tenantMode === 'off' || tenantMode === 'single') {
    return { action: 'skip', reason: `mode-${tenantMode}` };
  }

  // ── 2. Route exemptée → skip ──────────────────────────────────────────────
  if (isSkippedRoute(config.skipRoutesRegex)) {
    return { action: 'skip', reason: 'skipped-route' };
  }

  // ── 3. Tenant store pas encore résolu → attendre ──────────────────────────
  if (tenantStatus === 'loading' || tenantStatus === 'idle') {
    return { action: 'idle' };
  }

  // ── 4. Analyser le hostname ───────────────────────────────────────────────
  const hostname = window.location.hostname;
  const analysis = analyzeSubdomain(hostname, config.rootDomain);

  // Dev / localhost → skip
  if (analysis.isLocalhost) {
    return { action: 'skip', reason: 'localhost-dev' };
  }

  // Root domain sans sous-domaine → page d'accueil globale (landing)
  if (analysis.isRootDomain || !analysis.hasSubdomain) {
    return { action: 'redirect-landing', reason: 'no-subdomain' };
  }

  // ── 5. Sous-domaine détecté — valider dans la registry ───────────────────
  const slug = analysis.subdomain!;
  const tenantFromRegistry = getTenantByDomain(hostname);

  if (!tenantFromRegistry) {
    if (config.unknownTenantBehavior === 'show-error') {
      return { action: 'error-unknown-tenant', slug };
    }
    return { action: 'redirect-landing', reason: 'unknown-tenant' };
  }

  // ── 6. Tenant connu — vérifier la suspension ──────────────────────────────
  if (tenantFromRegistry.suspended) {
    return {
      action: 'redirect-suspended',
      tenantSlug: tenantFromRegistry.id,
      message: tenantFromRegistry.suspendedMessage,
    };
  }

  // ── 7. Session résolue — décision finale ──────────────────────────────────
  // session.authenticated === false → user non connecté (ou session expirée)
  if (!session.authenticated) {
    return { action: 'redirect-login', tenantSlug: tenantFromRegistry.id };
  }

  return { action: 'redirect-dashboard', tenantSlug: tenantFromRegistry.id };
}

// =============================================================================
//  useTenantRoutingNavigator — Hook d'effet de navigation
//  Séparé de la décision pour faciliter les tests unitaires.
//  Exécute navigate() en réponse aux décisions, une seule fois par décision.
// =============================================================================
export function useTenantRoutingNavigator(
  decision: RoutingDecision,
  config: ConfigSchema,
): void {
  const navigatedRef = useRef<string>('');

  useEffect(() => {
    const key = JSON.stringify(decision);
    if (navigatedRef.current === key) return;

    switch (decision.action) {
      case 'idle':
      case 'skip':
        return;

      case 'redirect-landing': {
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

      case 'redirect-dashboard': {
        navigatedRef.current = key;
        navigate({ to: interpolateUrl(config.tenantDashboardUrl) });
        break;
      }

      case 'redirect-suspended': {
        navigatedRef.current = key;
        navigate({ to: interpolateUrl(config.tenantSuspendedUrl) });
        break;
      }

      case 'error-unknown-tenant': {
        navigatedRef.current = key;
        const base = interpolateUrl(config.landingPageUrl);
        navigate({ to: `${base}?error=unknown-tenant&slug=${encodeURIComponent(decision.slug)}` });
        break;
      }
    }
  }, [decision, config]);
}
