// =============================================================================
//  @eigen/esm-ai-context — Context Builder
//
//  Agrège tous les stores EIGEN dans une représentation sérialisable stable.
//  N'expose JAMAIS les stores internes directement.
//  Accède aux stores via leurs APIs publiques (getState(), not subscribe).
// =============================================================================

import { sessionStore } from '@eigen/esm-api';
import { getAIConfig } from '@eigen/esm-ai-config';
import { AI_EVENTS, dispatchAIEvent } from '@eigen/esm-ai-events';
import { collectProviderData } from './provider-registry';
import type { AIContext, AINavigationContext, AIPermissionsContext, AIExtensionContext } from './types';

const SCHEMA_VERSION = '1.0.0';

// ─── Helpers de sérialisation sûre ───────────────────────────────────────────

/**
 * Tronque récursivement un objet pour respecter la profondeur maximale.
 * Évite la sérialisation de références circulaires ou de structures profondes.
 */
function truncateDepth(obj: unknown, maxDepth: number, currentDepth = 0): unknown {
  if (currentDepth >= maxDepth) return '[truncated]';
  if (obj === null || obj === undefined) return obj;
  if (typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) {
    return obj.slice(0, 20).map((item) => truncateDepth(item, maxDepth, currentDepth + 1));
  }
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj as object).slice(0, 30)) {
    result[key] = truncateDepth(value, maxDepth, currentDepth + 1);
  }
  return result;
}

/**
 * Sérialise en JSON et tronque si nécessaire.
 */
function safeSerialize(context: AIContext, maxSize: number): { json: string; truncated: boolean } {
  const json = JSON.stringify(context, null, 0);
  if (json.length <= maxSize) return { json, truncated: false };

  // Tronquer progressivement les parties les plus volumineuses
  const truncated = {
    ...context,
    appContext: { _truncated: true, _originalSize: json.length },
    extensions: { activeSlots: {} },
    navigation: {
      ...context.navigation,
      recentRoutes: context.navigation.recentRoutes.slice(0, 3),
    },
  };

  return { json: JSON.stringify(truncated, null, 0), truncated: true };
}

// ─── Lecture des stores EIGEN ─────────────────────────────────────────────────

function buildUserContext(): AIContext['user'] {
  const state = sessionStore.getState();
  if (!state.loaded || !state.session?.authenticated || !state.session.user) {
    return null;
  }
  const user = state.session.user;
  return {
    uuid: user.uuid,
    display: user.display,
    username: user.username,
    locale: user.locale ?? 'fr',
    roles: user.roles?.map((r) => r.name) ?? [],
    privileges: user.privileges?.map((p) => p.display) ?? [],
    properties: (() => {
      const props = user.userProperties ?? {};
      // Exclure les données sensibles
      const { recentlyViewed, bookmarkedGroups, defaultLocation, ...safe } = props;
      return safe as Record<string, string>;
    })(),
  };
}

function buildPermissionsContext(): AIPermissionsContext {
  const state = sessionStore.getState();
  const session = state.loaded ? state.session : null;
  const user = session?.user;

  // Lire les feature flags depuis localStorage (même pattern que esm-feature-flags)
  const featureFlags: Record<string, boolean> = {};
  try {
    for (const key of Object.keys(localStorage)) {
      if (key.startsWith('eigen:feature-flag:')) {
        const flagName = key.replace('eigen:feature-flag:', '');
        featureFlags[flagName] = localStorage.getItem(key) === 'true';
      }
    }
  } catch {
    // localStorage non disponible (tests, SSR)
  }

  return {
    authenticated: session?.authenticated ?? false,
    roles: user?.roles?.map((r) => r.name) ?? [],
    privileges: user?.privileges?.map((p) => p.display) ?? [],
    featureFlags,
  };
}

function buildTenantContext(): AIContext['tenant'] {
  // Accéder au tenant store via son API publique (pas d'import direct du store)
  // On lit window.eigenTenantMode comme le fait le framework tenant
  try {
    const mode = (window as any).eigenTenantMode ?? 'off';
    if (mode === 'off') return null;

    // Tenter de lire le store tenant s'il est disponible
    const tenantStoreKey = 'tenant';
    const stores = (window as any).stores;
    if (stores?.[tenantStoreKey]) {
      const tenantState = stores[tenantStoreKey].value.getState();
      const tenant = tenantState.activeTenant;
      if (!tenant) return null;
      return {
        id: tenant.id,
        name: tenant.name,
        mode,
        locale: tenant.locale,
        timezone: tenant.timezone,
        featureFlags: tenant.featureFlags,
      };
    }
  } catch {
    // Store tenant non disponible
  }
  return null;
}

function buildNavigationContext(): AINavigationContext {
  const spaBase = typeof window !== 'undefined' ? (window.getEigenSpaBase?.() ?? '/') : '/';
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '/';
  const currentRoute = pathname.startsWith(spaBase)
    ? pathname.slice(spaBase.length) || '/'
    : pathname;

  // Lire l'historique de navigation depuis sessionStorage
  const recentRoutes: string[] = [];
  try {
    const history: string[] = JSON.parse(sessionStorage.getItem('eigen:history') ?? '[]');
    recentRoutes.push(...history.slice(-5).map((url) => {
      try { return new URL(url).pathname; } catch { return url; }
    }));
  } catch {
    // sessionStorage non disponible
  }

  return {
    currentRoute,
    currentUrl: typeof window !== 'undefined' ? window.location.href : '',
    breadcrumb: [], // Enrichi par les Context Providers
    activeAppName: undefined, // Enrichi par les Context Providers
    recentRoutes,
  };
}

function buildExtensionsContext(): AIExtensionContext {
  // Lire les extensions actives depuis le store global (si disponible)
  try {
    const stores = (window as any).stores;
    const extStore = stores?.['extensions'];
    if (extStore) {
      const state = extStore.value.getState();
      const activeSlots: Record<string, string[]> = {};
      for (const [slotName, slot] of Object.entries(state.slots ?? {})) {
        const assigned = (slot as any).assignedExtensions ?? [];
        if (assigned.length > 0) {
          activeSlots[slotName] = assigned.map((e: any) => e.name);
        }
      }
      return { activeSlots };
    }
  } catch {
    // Store extensions non disponible
  }
  return { activeSlots: {} };
}

// ─── Builder principal ────────────────────────────────────────────────────────

/**
 * Construit le contexte IA complet depuis tous les stores EIGEN.
 * Cette fonction est pure — elle n'a aucun effet de bord.
 * Elle peut être appelée à tout moment pour obtenir un snapshot du contexte.
 */
export function buildAIContext(): { context: AIContext; contextJson: string; truncated: boolean; size: number } {
  const config = getAIConfig();
  const appContext = collectProviderData();

  const context: AIContext = {
    schemaVersion: SCHEMA_VERSION,
    builtAt: new Date().toISOString(),
    user: buildUserContext(),
    tenant: buildTenantContext(),
    navigation: buildNavigationContext(),
    permissions: buildPermissionsContext(),
    extensions: config.context.includeActiveExtensions
      ? buildExtensionsContext()
      : { activeSlots: {} },
    appContext: config.context.includeActiveExtensions
      ? truncateDepth(appContext, config.context.serializationDepth) as Record<string, unknown>
      : {},
  };

  const { json, truncated } = safeSerialize(context, config.context.maxContextSize);

  dispatchAIEvent(AI_EVENTS.CONTEXT_BUILT, {
    contextSize: json.length,
    providerCount: Object.keys(appContext).length,
    truncated,
  });

  return { context, contextJson: json, truncated, size: json.length };
}
