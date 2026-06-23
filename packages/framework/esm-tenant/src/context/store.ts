// ============================================================================
//  @egen/esm-tenant — Store Zustand global du système tenant
// ============================================================================
//
//  Le store est le point central de vérité pour l'état tenant au runtime.
//  Il suit exactement le même pattern que les autres stores EGEN
//  (esm-feature-flags, esm-state) pour une intégration sans friction.
//
//  IMPORTANT — SINGLETON MODULE FEDERATION :
//  Ce module DOIT être partagé en singleton via Module Federation pour que
//  toutes les microfrontends lisent le même état. Configurez :
//    shared: { '@egen/esm-tenant': { singleton: true, eager: true } }
// ============================================================================

import { createGlobalStore } from '@egen/esm-state';
import type { TenantStore, TenantDefinition, TenantMode, TenantStatus, TenantSystemConfig } from '../types';

const DEFAULT_CONFIG: TenantSystemConfig = {
  mode: 'off',
  resolutionOrder: ['subdomain', 'path', 'query', 'jwt', 'header', 'localStorage', 'static', 'first'],
  persistActive: true,
  storageKey: 'egen:tenant:active',
  applyTheme: true,
};

/**
 * Store global Zustand du système tenant.
 * Enregistré sous le nom "tenant" dans le registre EGEN.
 *
 * Usage direct (avancé) :
 * ```ts
 * import { tenantStore } from '@egen/esm-tenant';
 * import { useStore } from '@egen/esm-react-utils';
 *
 * const { activeTenant, mode } = useStore(tenantStore);
 * ```
 */
export const tenantStore = createGlobalStore<TenantStore>('tenant', {
  mode: 'off',
  status: 'idle',
  activeTenant: null,
  availableTenants: [],
  error: null,
  resolvedAt: null,
  config: DEFAULT_CONFIG,
});


// ---------------------------------------------------------------------------
// Mutations internes
// ---------------------------------------------------------------------------

/** @internal */
export function setTenantStoreStatus(status: TenantStatus, error?: string): void {
  tenantStore.setState((s) => ({ ...s, status, error: error ?? null }));
}

/** @internal */
export function setAvailableTenants(tenants: TenantDefinition[]): void {
  tenantStore.setState((s) => ({ ...s, availableTenants: tenants }));
}

/** @internal */
export function setActiveTenantInStore(tenant: TenantDefinition | null): void {
  tenantStore.setState((s) => ({
    ...s,
    activeTenant: tenant,
    status: tenant ? (tenant.suspended ? 'suspended' : 'active') : 'idle',
    resolvedAt: tenant ? Date.now() : null,
    error: null,
  }));
}

/** @internal */
export function setTenantMode(mode: TenantMode): void {
  tenantStore.setState((s) => ({ ...s, mode, config: { ...s.config, mode } }));
}

/** @internal */
export function setTenantConfig(config: Partial<TenantSystemConfig>): void {
  tenantStore.setState((s) => ({
    ...s,
    mode: config.mode ?? s.mode,
    config: { ...s.config, ...config },
  }));
}

// ---------------------------------------------------------------------------
// Getters synchrones publics
// ---------------------------------------------------------------------------

/** @category Tenant */
export function getTenantStoreState(): TenantStore {
  return tenantStore.getState();
}

/** @category Tenant */
export function getTenantStore() {
  return tenantStore;
}

/** @category Tenant */
export function getActiveTenant(): TenantDefinition | null {
  return tenantStore.getState().activeTenant;
}

/** @category Tenant */
export function getAvailableTenants(): TenantDefinition[] {
  return tenantStore.getState().availableTenants;
}

/** @category Tenant */
export function getTenantSystemMode(): TenantMode {
  return tenantStore.getState().mode;
}

/**
 * S'abonne aux changements du store tenant.
 * @returns Fonction de désabonnement.
 * @category Tenant
 */
export function subscribeTenantStore(listener: (state: TenantStore) => void): () => void {
  return tenantStore.subscribe(listener);
}

// ---------------------------------------------------------------------------
// Reset (tests uniquement)
// ---------------------------------------------------------------------------

/** @internal */
export function resetTenantStore(): void {
  tenantStore.setState(
    {
      mode: 'off',
      status: 'idle',
      activeTenant: null,
      availableTenants: [],
      error: null,
      resolvedAt: null,
      config: DEFAULT_CONFIG,
    },
    true,
  );
}
