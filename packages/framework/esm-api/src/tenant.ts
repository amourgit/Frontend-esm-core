// ============================================================================
//  @egen/esm-api — Accès synchrone aux données tenant (lecture seule)
// ============================================================================
//
//  Ce module fournit des fonctions utilitaires SYNCHRONES pour accéder aux
//  informations du tenant courant depuis n'importe quel service, intercepteur
//  fetch, ou code non-React — exactement comme `getSessionStore()` pour la
//  session utilisateur.
//
//  IMPORTANT : ce fichier NE dépend PAS de @egen/esm-tenant. Il lit le store
//  via le registre global `availableStores` de @egen/esm-state (par nom "tenant"),
//  ce qui évite toute dépendance circulaire entre esm-api et esm-tenant.
//  Si le store tenant n'est pas encore initialisé, les fonctions retournent null.
//
//  USAGE TYPIQUE (dans un intercepteur fetch) :
//  ```ts
//  import { getTenantId, getTenantApiBase } from '@egen/esm-api';
//
//  async function myFetch(url: string, init?: RequestInit) {
//    const tenantId = getTenantId();
//    return fetch(url, {
//      ...init,
//      headers: {
//        ...(tenantId ? { 'X-Tenant-ID': tenantId } : {}),
//        ...init?.headers,
//      },
//    });
//  }
//  ```
// ============================================================================

import { getGlobalStore } from '@egen/esm-state';

interface MinimalTenantState {
  activeTenant: {
    id: string;
    name: string;
    apiBaseUrl?: string;
    locale?: string;
    timezone?: string;
    featureFlags?: Record<string, boolean>;
    permissions?: Record<string, boolean | string[]>;
    meta?: Record<string, unknown>;
  } | null;
  mode: 'off' | 'single' | 'multi';
}

function getTenantState(): MinimalTenantState | null {
  const store = getGlobalStore<MinimalTenantState>('tenant');
  return store?.getState() ?? null;
}

/**
 * Retourne l'ID du tenant actif, ou `undefined` si mode "off" / non résolu.
 * Synchrone — utilisable dans des intercepteurs fetch, services, etc.
 *
 * @category Tenant
 */
export function getTenantId(): string | undefined {
  return getTenantState()?.activeTenant?.id;
}

/**
 * Retourne l'objet tenant actif complet, ou `null`.
 * @category Tenant
 */
export function getActiveTenantInfo(): MinimalTenantState['activeTenant'] {
  return getTenantState()?.activeTenant ?? null;
}

/**
 * Retourne l'URL de l'API backend du tenant actif.
 * À utiliser pour construire les URLs d'appels backend dans les services.
 *
 * @example
 * ```ts
 * const base = getTenantApiBase() ?? window.egenBase;
 * const data = await egenFetch(`${base}/api/students`);
 * ```
 * @category Tenant
 */
export function getTenantApiBase(): string | undefined {
  return getTenantState()?.activeTenant?.apiBaseUrl;
}

/**
 * Retourne les headers HTTP à ajouter à chaque requête vers le backend.
 * Retourne `{}` si aucun tenant actif ou mode "off".
 *
 * @example
 * ```ts
 * import { tenantHeaders } from '@egen/esm-api';
 * const response = await fetch(url, { headers: { ...tenantHeaders() } });
 * ```
 * @category Tenant
 */
export function tenantHeaders(): Record<string, string> {
  const id = getTenantId();
  return id ? { 'X-Tenant-ID': id } : {};
}

/**
 * Retourne la locale du tenant actif.
 * Utilisée par le système de traductions pour charger la bonne langue.
 * @category Tenant
 */
export function getTenantLocale(): string | undefined {
  return getTenantState()?.activeTenant?.locale;
}

/**
 * Retourne le fuseau horaire du tenant actif.
 * @category Tenant
 */
export function getTenantTimezone(): string | undefined {
  return getTenantState()?.activeTenant?.timezone;
}

/**
 * Retourne true si le mode multi-tenant est actif.
 * @category Tenant
 */
export function isMultiTenant(): boolean {
  return getTenantState()?.mode === 'multi';
}
