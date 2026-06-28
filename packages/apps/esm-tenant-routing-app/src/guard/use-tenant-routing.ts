import { useEffect, useRef, useState } from 'react';
import { useSession, useConfig, navigate, interpolateUrl } from '@egen/esm-framework';
import {
  useTenantMode,
  useTenantStatus,
  useTenant,
  getTenantStoreState,
  getTenantByDomain,
} from '@egen/esm-tenant';
import { analyzeSubdomain, buildLoginUrlWithTenant } from './subdomain-utils';
import { type ConfigSchema } from '../config-schema';

// =============================================================================
//  USE TENANT ROUTING — Logique de routage multi-tenant
//
//  Ce hook concentre TOUTE la logique de décision de navigation :
//
//  ┌─────────────────────────────────────────────────────────────────────┐
//  │  Mode tenant = 'off' ou 'single'                                    │
//  │    → Pas d'intervention, on laisse Single-SPA gérer le routing.     │
//  ├─────────────────────────────────────────────────────────────────────┤
//  │  Mode tenant = 'multi'                                               │
//  │                                                                     │
//  │  1. URL sur route exemptée (login, home, logout...) → skip          │
//  │                                                                     │
//  │  2. Analyser le hostname                                            │
//  │     a. Localhost/IP → skip (mode dev)                               │
//  │     b. Root domain (pas de sous-domaine) → → /home (landing)       │
//  │     c. Sous-domaine connu dans la registry → continuer              │
//  │     d. Sous-domaine inconnu → config unknownTenantBehavior          │
//  │        - "redirect-to-landing" → /home                             │
//  │        - "show-error"          → /tenant-suspended                  │
//  │                                                                     │
//  │  3. Tenant résolu (subdomain connu)                                 │
//  │     a. Tenant suspendu → /tenant-suspended                         │
//  │     b. Utilisateur connecté → /home du tenant (dashboard)           │
//  │     c. Utilisateur non connecté → /login (avec tenant en context)   │
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

export interface TenantRoutingState {
  decision: RoutingDecision;
  isReady: boolean;
}

/**
 * Retourne true si la route courante est exemptée de la garde de routage.
 */
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

/**
 * Hook principal de routage tenant.
 * Évalué à chaque changement de session, tenant ou route.
 * Ne produit des effets de navigation que quand la décision est définitive.
 */
export function useTenantRouting(): TenantRoutingState {
  const config = useConfig<ConfigSchema>();
  const tenantMode = useTenantMode();
  const tenantStatus = useTenantStatus();
  const activeTenant = useTenant();
  const { session, isLoading: sessionLoading } = useSession();

  const [decision, setDecision] = useState<RoutingDecision>({ action: 'idle' });
  const [isReady, setIsReady] = useState(false);

  // Guard : éviter de naviguer plusieurs fois sur la même décision
  const lastDecisionRef = useRef<string>('');

  useEffect(() => {
    // ── 1. Système tenant désactivé ou mode single → pas d'intervention ──
    if (tenantMode === 'off' || tenantMode === 'single') {
      setDecision({ action: 'skip', reason: `mode-${tenantMode}` });
      setIsReady(true);
      return;
    }

    // ── 2. Route exemptée → skip ──────────────────────────────────────────
    if (isSkippedRoute(config.skipRoutesRegex)) {
      setDecision({ action: 'skip', reason: 'skipped-route' });
      setIsReady(true);
      return;
    }

    // ── 3. Attendre que le tenant store soit résolu (pas en loading) ──────
    if (tenantStatus === 'loading') {
      setDecision({ action: 'idle' });
      setIsReady(false);
      return;
    }

    // ── 4. Analyser le hostname courant ───────────────────────────────────
    const hostname = window.location.hostname;
    const analysis = analyzeSubdomain(hostname, config.rootDomain);

    // Dev / localhost → skip (pas de logique tenant)
    if (analysis.isLocalhost) {
      setDecision({ action: 'skip', reason: 'localhost-dev' });
      setIsReady(true);
      return;
    }

    // Root domain sans sous-domaine → page d'accueil globale
    if (analysis.isRootDomain || !analysis.hasSubdomain) {
      const newDecision: RoutingDecision = { action: 'redirect-landing', reason: 'no-subdomain' };
      const key = JSON.stringify(newDecision);
      if (lastDecisionRef.current !== key) {
        lastDecisionRef.current = key;
        setDecision(newDecision);
        setIsReady(true);
      }
      return;
    }

    // ── 5. Sous-domaine détecté — le valider dans la registry ─────────────
    const slug = analysis.subdomain!;

    // Chercher dans la registry tenant (getTenantByDomain recherche par slug, id et domains[])
    const tenantFromRegistry = getTenantByDomain(hostname);

    if (!tenantFromRegistry) {
      // Tenant inconnu
      if (config.unknownTenantBehavior === 'show-error') {
        const newDecision: RoutingDecision = { action: 'error-unknown-tenant', slug };
        const key = JSON.stringify(newDecision);
        if (lastDecisionRef.current !== key) {
          lastDecisionRef.current = key;
          setDecision(newDecision);
          setIsReady(true);
        }
      } else {
        const newDecision: RoutingDecision = { action: 'redirect-landing', reason: 'unknown-tenant' };
        const key = JSON.stringify(newDecision);
        if (lastDecisionRef.current !== key) {
          lastDecisionRef.current = key;
          setDecision(newDecision);
          setIsReady(true);
        }
      }
      return;
    }

    // ── 6. Tenant connu — vérifier la suspension ──────────────────────────
    if (tenantFromRegistry.suspended) {
      const newDecision: RoutingDecision = {
        action: 'redirect-suspended',
        tenantSlug: tenantFromRegistry.id,
        message: tenantFromRegistry.suspendedMessage,
      };
      const key = JSON.stringify(newDecision);
      if (lastDecisionRef.current !== key) {
        lastDecisionRef.current = key;
        setDecision(newDecision);
        setIsReady(true);
      }
      return;
    }

    // ── 7. Attendre la résolution de la session ───────────────────────────
    if (sessionLoading) {
      setDecision({ action: 'idle' });
      setIsReady(false);
      return;
    }

    // ── 8. Session résolue — décision finale ──────────────────────────────
    const isAuthenticated = session?.authenticated === true;

    if (isAuthenticated) {
      const newDecision: RoutingDecision = {
        action: 'redirect-dashboard',
        tenantSlug: tenantFromRegistry.id,
      };
      const key = JSON.stringify(newDecision);
      if (lastDecisionRef.current !== key) {
        lastDecisionRef.current = key;
        setDecision(newDecision);
        setIsReady(true);
      }
    } else {
      const newDecision: RoutingDecision = {
        action: 'redirect-login',
        tenantSlug: tenantFromRegistry.id,
      };
      const key = JSON.stringify(newDecision);
      if (lastDecisionRef.current !== key) {
        lastDecisionRef.current = key;
        setDecision(newDecision);
        setIsReady(true);
      }
    }
  }, [
    tenantMode,
    tenantStatus,
    activeTenant,
    session,
    sessionLoading,
    config.rootDomain,
    config.skipRoutesRegex,
    config.unknownTenantBehavior,
  ]);

  return { decision, isReady };
}

/**
 * Hook qui exécute les navigations en réponse aux décisions du routing.
 * Séparé du hook de décision pour faciliter les tests unitaires.
 */
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
        const url = interpolateUrl(config.landingPageUrl);
        navigate({ to: url });
        break;
      }

      case 'redirect-login': {
        navigatedRef.current = key;
        // Injecter le tenant dans l'URL de login pour que la page login
        // puisse pré-configurer le contexte tenant de l'authentification.
        const loginBase = interpolateUrl(config.loginUrl);
        const urlWithTenant = buildLoginUrlWithTenant(loginBase, decision.tenantSlug);
        navigate({ to: urlWithTenant });
        break;
      }

      case 'redirect-dashboard': {
        navigatedRef.current = key;
        const url = interpolateUrl(config.tenantDashboardUrl);
        navigate({ to: url });
        break;
      }

      case 'redirect-suspended': {
        navigatedRef.current = key;
        const url = interpolateUrl(config.tenantSuspendedUrl);
        navigate({ to: url });
        break;
      }

      case 'error-unknown-tenant': {
        navigatedRef.current = key;
        // Rediriger vers la landing avec un query param d'erreur
        const base = interpolateUrl(config.landingPageUrl);
        const errorUrl = `${base}?error=unknown-tenant&slug=${encodeURIComponent(decision.slug)}`;
        navigate({ to: errorUrl });
        break;
      }

      default:
        break;
    }
  }, [decision, config]);
}
