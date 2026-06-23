// ============================================================================
//  @egen/esm-tenant — Utilitaires publics
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
 */
export function getCurrentTenant(): TenantDefinition | null {
  return getActiveTenant();
}

/** Retourne l'ID du tenant actif, ou `undefined` si mode "off" / pas de tenant. */
export function getCurrentTenantId(): TenantId | undefined {
  return getActiveTenant()?.id;
}

/**
 * Retourne l'URL de l'API backend du tenant actif, ou `undefined`.
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

/** Retourne true si le mode multi-tenant est actif. */
export function isMultiTenantMode(): boolean {
  return getTenantSystemMode() === 'multi';
}

/** Retourne true si un tenant spécifique est actif. */
export function isTenantActive(tenantId: TenantId): boolean {
  return getActiveTenant()?.id === tenantId;
}

/** Vérifie si un feature flag est activé pour le tenant courant (version non-React). */
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
 * @example `{ 'X-Tenant-ID': 'acme' }` ou `{}` si mode "off"
 */
export function getTenantHeaders(): Record<string, string> {
  const tenant = getActiveTenant();
  if (!tenant) return {};
  return { 'X-Tenant-ID': tenant.id };
}

/**
 * Wrapper fetch qui ajoute automatiquement les headers tenant.
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
