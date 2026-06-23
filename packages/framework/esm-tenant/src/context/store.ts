// ============================================================================
//  @eigen/esm-tenant — Store global du système tenant
// ============================================================================
//
//  Utilise `createGlobalStore` de @eigen/esm-state :
//   - Enregistré sous le nom "tenant" dans la map globale `availableStores`
//   - Module Federation le retrouve par nom même chargé par plusieurs MFEs
//   - Consommable via `useStore(tenantStore)` de esm-react-utils
//   - Visible dans window.stores en mode développement
// ============================================================================

import { createGlobalStore } from '@eigen/esm-state';
import type { TenantStore, TenantDefinition, TenantMode, TenantStatus, TenantSystemConfig } from '../types';

const DEFAULT_CONFIG: TenantSystemConfig = {
  mode: 'off',
  resolutionOrder: ['subdomain', 'path', 'query', 'jwt', 'header', 'localStorage', 'static', 'first'],
  persistActive: true,
  storageKey: 'eigen:tenant:active',
  applyTheme: true,
};

/**
 * Store global Zustand du système tenant.
 * Enregistré sous le nom "tenant" dans le registre EIGEN.
 *
 * Usage direct (avancé) :
 * ```ts
 * import { tenantStore } from '@eigen/esm-tenant';
 * import { useStore } from '@eigen/esm-react-utils';
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
