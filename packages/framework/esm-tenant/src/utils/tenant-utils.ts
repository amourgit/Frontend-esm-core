// ============================================================================
//  @egen/esm-tenant — Utilitaires publics
// ============================================================================
//
//  RELATION AVEC @egen/esm-api :
//  ──────────────────────────────
//  @egen/esm-api expose un sous-ensemble de ces mêmes informations (lecture
//  du store tenant, sans importer ce package — voir esm-api/src/tenant.ts)
//  pour rester utilisable sans dépendance runtime sur @egen/esm-tenant.
//  C'est CETTE version (@egen/esm-api) qui est effectivement câblée dans le
//  client HTTP central du monorepo (`egenFetch`, voir
//  esm-api/src/egen-fetch.ts) : le header X-Tenant-ID y est injecté
//  automatiquement, sans action requise de l'appelant.
//
//  Les fonctions ci-dessous marquées @deprecated ont un équivalent strict
//  côté esm-api — les utiliser depuis esm-api si le seul besoin est un accès
//  HTTP/synchrone simple. Les fonctions NON dépréciées ci-dessous (accès à
//  la registry complète, permissions, feature flags, abonnement aux
//  changements, construction d'URL) n'ont pas d'équivalent côté esm-api et
//  restent le point d'entrée normal pour ces besoins.
// ============================================================================

import type { TenantDefinition, TenantId } from '../types';
import { getTenantById as getById, getAllTenants } from '../context/registry';
import {
  tenantStore,
  getActiveTenant,
  getAvailableTenants,
  getTenantSystemMode,
  getTenantStoreState,
} from '../context/store';

// ---------------------------------------------------------------------------
// Accès synchrone (hors React — pour services, intercepteurs, etc.)
// ---------------------------------------------------------------------------

/**
 * Retourne le tenant actif de manière synchrone (sans React).
 * Utile dans les intercepteurs fetch, les services, etc.
 *
 * @deprecated Préférer `getActiveTenantInfo()` de `@egen/esm-api` pour un
 * accès HTTP/service sans dépendance runtime sur ce package. Cette version
 * reste utile quand l'objet `TenantDefinition` complet est nécessaire (ex:
 * `allowedApps`, `themeOverride`) — `getActiveTenantInfo()` n'expose qu'un
 * sous-ensemble.
 */
export function getCurrentTenant(): TenantDefinition | null {
  return getActiveTenant();
}

/**
 * Retourne l'ID du tenant actif, ou `undefined` si mode "off" / pas de tenant.
 * @deprecated Utiliser `getTenantId()` de `@egen/esm-api` — c'est cette
 * version qui est utilisée par le client HTTP central (`egenFetch`).
 */
export function getCurrentTenantId(): TenantId | undefined {
  return getActiveTenant()?.id;
}

/**
 * Retourne l'URL de l'API backend du tenant actif, ou `undefined`.
 * @deprecated Utiliser `getTenantApiBase()` de `@egen/esm-api`.
 * @example
 * ```ts
 * const base = getTenantApiBaseUrl() ?? window.egenBase;
 * ```
 */
export function getTenantApiBaseUrl(): string | undefined {
  return getActiveTenant()?.apiBaseUrl;
}

/** Retourne le tenant complet par son ID depuis la registry. */
export function getTenantDefinition(id: TenantId): TenantDefinition | undefined {
  return getById(id);
}

/** Retourne true si le système tenant est activé (mode !== "off"). */
export function isTenantSystemActive(): boolean {
  return getTenantSystemMode() !== 'off';
}

/**
 * Retourne true si le mode multi-tenant est actif.
 * @deprecated Utiliser `isMultiTenant()` de `@egen/esm-api` — déjà utilisée
 * ainsi dans esm-login-app et esm-primary-navigation-app.
 */
export function isMultiTenantMode(): boolean {
  return getTenantSystemMode() === 'multi';
}

/** Retourne true si un tenant spécifique est actif. */
export function isTenantActive(tenantId: TenantId): boolean {
  return getActiveTenant()?.id === tenantId;
}

/**
 * Vérifie si un feature flag est activé pour le tenant courant (version non-React).
 * Modèle "opt-in" strict : `undefined` → `false`. Pour un modèle "opt-out"
 * réactif (flag actif par défaut sauf désactivation explicite), voir le hook
 * `useTenantFeatureFlag(flagName, true)` — utilisé par exemple par
 * esm-ai-assistant-app pour se désactiver par tenant.
 */
export function tenantHasFeatureFlag(flagName: string): boolean {
  return getActiveTenant()?.featureFlags?.[flagName] === true;
}

/** Vérifie si une permission est accordée pour le tenant courant. */
export function tenantHasPermission(key: string): boolean {
  const perm = getActiveTenant()?.permissions?.[key];
  return perm === true || Array.isArray(perm);
}

/**
 * S'abonne aux changements de tenant actif.
 * Retourne une fonction de nettoyage.
 *
 * @example
 * ```ts
 * const unsubscribe = onTenantChange((tenant) => {
 *   refreshApiClient(tenant?.apiBaseUrl);
 * });
 * ```
 */
export function onTenantChange(callback: (tenant: TenantDefinition | null) => void): () => void {
  let previous: TenantDefinition | null = getActiveTenant();

  return tenantStore.subscribe((state) => {
    if (state.activeTenant?.id !== previous?.id) {
      previous = state.activeTenant;
      callback(state.activeTenant);
    }
  });
}

/**
 * Construit une URL en préfixant le path du tenant si nécessaire.
 * Utile pour les stratégies de routing basées sur le path.
 *
 * @example
 * ```ts
 * buildTenantUrl('/dashboard') // → '/t/acme/dashboard' si pathPrefix='/t/'
 * ```
 */
export function buildTenantUrl(path: string, tenantId?: TenantId): string {
  const state = getTenantStoreState();
  const id = tenantId ?? state.activeTenant?.id;
  if (!id || state.mode !== 'multi') return path;

  const prefix = state.config.pathConfig?.prefix;
  if (!prefix) return path;

  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${prefix}${id}${cleanPath}`;
}

// ---------------------------------------------------------------------------
// Intercept de headers HTTP
// ---------------------------------------------------------------------------

/**
 * Retourne les headers HTTP à ajouter à chaque requête.
 * @deprecated Utiliser `tenantHeaders()` de `@egen/esm-api`. Mieux encore :
 * `egenFetch()` (aussi dans `@egen/esm-api`) injecte déjà automatiquement
 * X-Tenant-ID sur chaque requête — dans la plupart des cas, aucun appel
 * manuel n'est nécessaire (voir esm-api/src/egen-fetch.ts).
 * @example `{ 'X-Tenant-ID': 'acme' }` ou `{}` si mode "off"
 */
export function getTenantHeaders(): Record<string, string> {
  const tenant = getActiveTenant();
  if (!tenant) return {};
  return { 'X-Tenant-ID': tenant.id };
}

/**
 * Wrapper fetch qui ajoute automatiquement les headers tenant.
 * @deprecated Utiliser `egenFetch()` de `@egen/esm-api`, qui fait déjà cette
 * injection pour toutes les requêtes passant par le client HTTP central du
 * monorepo (voir esm-api/src/egen-fetch.ts). Cette fonction reste utile
 * uniquement pour un `fetch()` natif ponctuel, hors du client central.
 * @example
 * ```ts
 * const response = await fetchWithTenant('/api/students');
 * ```
 */
export async function fetchWithTenant(url: string, init: RequestInit = {}): Promise<Response> {
  const tenantHeaders = getTenantHeaders();
  const merged: RequestInit = {
    ...init,
    headers: {
      ...tenantHeaders,
      ...(init.headers ?? {}),
    },
  };
  return fetch(url, merged);
}
