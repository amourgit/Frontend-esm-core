import { useEffect, useRef } from 'react';
import { useSession, useConfig, navigate, interpolateUrl } from '@egen/esm-framework';
import { useTenantMode, useTenantStatus, useTenant, getTenantByDomain } from '@egen/esm-tenant';
import { analyzeSubdomain, buildLoginUrlWithTenant } from './subdomain-utils';
import { type ConfigSchema } from '../config-schema';

// =============================================================================
//  USE TENANT ROUTING — Logique de routage multi-tenant
//
//  ┌─────────────────────────────────────────────────────────────────────────┐
//  │  PRINCIPE DE SÉPARATION DES RESPONSABILITÉS                             │
//  │                                                                         │
//  │  esm-tenant-routing-app  (ce fichier)                                  │
//  │    → Valide que le contexte TENANT est correct                         │
//  │    → Redirige si pas de tenant (landing globale)                       │
//  │    → Redirige si tenant inconnu ou suspendu                            │
//  │    → En mode multi + tenant valide + non connecté → /login?tenant=slug │
//  │    → Partout ailleurs : SKIP (ne touche pas à la navigation)           │
//  │                                                                         │
//  │  esm-primary-navigation-app/Navbar                                     │
//  │    → Rend le Carbon Header quand l'utilisateur est connecté            │
//  │    → En mode SINGLE/OFF seulement : redirige vers /login si non conn.  │
//  │    → En mode MULTI : ne redirige PAS (le Guard ci-dessus le fait)      │
//  │                                                                         │
//  │  RÈGLE D'OR : jamais les deux n'émettent navigate() en même temps.     │
//  │    Mode multi  → Guard redirige,  Navbar observe                       │
//  │    Mode single → Guard silent,    Navbar redirige                      │
//  └─────────────────────────────────────────────────────────────────────────┘
//
//  useSession() utilise React Suspense : il throw une Promise si la session
//  n'est pas encore chargée. Le composant TenantRoutingGuard wrappé dans
//  <Suspense fallback={null}> gère ce cas.
// =============================================================================

export type RoutingDecision =
  | { action: 'idle' }
  | { action: 'skip'; reason: string }
  | { action: 'redirect-global-landing'; reason: string }
  | { action: 'redirect-login'; tenantSlug: string }
  | { action: 'redirect-suspended'; tenantSlug: string; message?: string }
  | { action: 'redirect-unknown-tenant'; slug: string };

// ── Helpers ────────────────────────────────────────────────────────────────

/**
 * Retourne true si le path courant est une route publique exemptée
 * de toute logique de routage tenant.
 */
function isPublicRoute(skipRegex: string): boolean {
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
//  useTenantRouting — Calcule la décision de routage (synchrone, pur)
//
//  Ce hook est appelé depuis l'intérieur d'une limite Suspense
//  (TenantRoutingGuard → Suspense → TenantRoutingGuardInner).
//  useSession() peut donc throw sans conséquence.
// =============================================================================
export function useTenantRouting(): RoutingDecision {
  const config = useConfig<ConfigSchema>();
  const tenantMode = useTenantMode();
  const tenantStatus = useTenantStatus();
  // activeTenant : résolu par le store tenant (subdomain, header, jwt, etc.)
  const activeTenant = useTenant();
  // session : throw si pas encore chargé → géré par Suspense parent
  const session = useSession();

  // ── 1. Système tenant désactivé ou mode single ─────────────────────────
  //  Le Guard est entièrement silencieux. La Navbar gère l'auth seule.
  if (tenantMode === 'off' || tenantMode === 'single') {
    return { action: 'skip', reason: `tenant-mode-${tenantMode}` };
  }

  // ── 2. Route publique exemptée → skip ──────────────────────────────────
  //  login, logout, home (landing), change-password, tenant-suspended.
  //  Ces routes gèrent elles-mêmes leur contexte.
  if (isPublicRoute(config.skipRoutesRegex)) {
    return { action: 'skip', reason: 'public-route' };
  }

  // ── 3. Tenant store pas encore initialisé → attendre ──────────────────
  if (tenantStatus === 'idle' || tenantStatus === 'loading') {
    return { action: 'idle' };
  }

  // ── 4. Analyser le hostname pour détecter un sous-domaine ─────────────
  const hostname = window.location.hostname;
  const analysis = analyzeSubdomain(hostname, config.rootDomain);

  // Dev (localhost / IP) → skip : pas de logique tenant en local
  if (analysis.isLocalhost) {
    return { action: 'skip', reason: 'localhost-dev' };
  }

  // Pas de sous-domaine sur le root domain → l'utilisateur est sur
  // l'URL globale de la plateforme (ex: egen.gabon.gov.ga/quelque-chose)
  // sans être dans un espace tenant. On le renvoie à la landing globale.
  if (analysis.isRootDomain || !analysis.hasSubdomain) {
    return { action: 'redirect-global-landing', reason: 'no-subdomain' };
  }

  // ── 5. Sous-domaine détecté — valider dans la registry ────────────────
  const tenantFromRegistry = getTenantByDomain(hostname);

  if (!tenantFromRegistry) {
    // Sous-domaine inconnu de la registry
    if (config.unknownTenantBehavior === 'show-error') {
      return { action: 'redirect-unknown-tenant', slug: analysis.subdomain! };
    }
    return { action: 'redirect-global-landing', reason: 'unknown-tenant' };
  }

  // ── 6. Tenant suspendu ─────────────────────────────────────────────────
  if (tenantFromRegistry.suspended) {
    return {
      action: 'redirect-suspended',
      tenantSlug: tenantFromRegistry.id,
      message: tenantFromRegistry.suspendedMessage,
    };
  }

  // ── 7. Tenant valide — vérifier l'authentification ────────────────────
  //  Le Guard est la SEULE source d'auth-redirect en mode multi-tenant.
  //  La Navbar (primary-nav) NE redirige PAS vers login en mode multi,
  //  pour éviter les navigations simultanées contradictoires.
  if (!session.authenticated) {
    return { action: 'redirect-login', tenantSlug: tenantFromRegistry.id };
  }

  // ── 8. Tenant valide + utilisateur connecté ────────────────────────────
  //  Le Guard n'interfère plus. L'utilisateur est au bon endroit.
  //  La Navbar rend le Carbon Header. Single-SPA route normalement.
  return { action: 'skip', reason: 'tenant-ok-authenticated' };
}

// =============================================================================
//  useTenantRoutingNavigator — Exécute les navigate() en réaction aux décisions
//
//  Séparé du hook de décision pour faciliter les tests unitaires.
//  Chaque décision n'est exécutée qu'une seule fois (navigatedRef).
// =============================================================================
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

      case 'redirect-suspended': {
        navigatedRef.current = key;
        navigate({ to: interpolateUrl(config.tenantSuspendedUrl) });
        break;
      }

      case 'redirect-unknown-tenant': {
        navigatedRef.current = key;
        const base = interpolateUrl(config.landingPageUrl);
        navigate({
          to: `${base}?error=unknown-tenant&slug=${encodeURIComponent(decision.slug)}`,
        });
        break;
      }
    }
  }, [decision, config]);
}
