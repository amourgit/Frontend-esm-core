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

import { createStore } from 'zustand/vanilla';
import type { StoreApi } from 'zustand/vanilla';
import type { TenantStore, TenantDefinition, TenantMode, TenantStatus, TenantSystemConfig } from '../types';

// Store singleton
let _store: StoreApi<TenantStore> | null = null;

const DEFAULT_CONFIG: TenantSystemConfig = {
  mode: 'off',
  resolutionOrder: ['subdomain', 'path', 'query', 'jwt', 'header', 'localStorage', 'static', 'first'],
  persistActive: true,
  storageKey: 'egen:tenant:active',
  applyTheme: true,
};

function createTenantStore(initialConfig: TenantSystemConfig = DEFAULT_CONFIG): StoreApi<TenantStore> {
  return createStore<TenantStore>(() => ({
    mode: initialConfig.mode,
    status: 'idle',
    activeTenant: null,
    availableTenants: [],
    error: null,
    resolvedAt: null,
    config: { ...DEFAULT_CONFIG, ...initialConfig },
  }));
}

/**
 * Retourne (et crée si besoin) le store global du système tenant.
 * À ne pas appeler directement — utilisez les fonctions d'API publique.
 * @internal
 */
export function getTenantStore(): StoreApi<TenantStore> {
  if (!_store) {
    _store = createTenantStore();
  }
  return _store;
}

/** Réinitialise le store (tests uniquement) @internal */
export function resetTenantStore(config?: TenantSystemConfig): void {
  _store = createTenantStore(config);
}

// ---------------------------------------------------------------------------
// Mutations d'état internes
// ---------------------------------------------------------------------------

export function setTenantStoreStatus(status: TenantStatus, error?: string): void {
  getTenantStore().setState((s) => ({ ...s, status, error: error ?? null }));
}

export function setAvailableTenants(tenants: TenantDefinition[]): void {
  getTenantStore().setState((s) => ({ ...s, availableTenants: tenants }));
}

export function setActiveTenantInStore(tenant: TenantDefinition | null): void {
  getTenantStore().setState((s) => ({
    ...s,
    activeTenant: tenant,
    status: tenant ? (tenant.suspended ? 'suspended' : 'active') : 'idle',
    resolvedAt: tenant ? Date.now() : null,
    error: null,
  }));
}

export function setTenantMode(mode: TenantMode): void {
  getTenantStore().setState((s) => ({ ...s, mode, config: { ...s.config, mode } }));
}

export function setTenantConfig(config: Partial<TenantSystemConfig>): void {
  getTenantStore().setState((s) => ({
    ...s,
    mode: config.mode ?? s.mode,
    config: { ...s.config, ...config },
  }));
}

// ---------------------------------------------------------------------------
// Getters
// ---------------------------------------------------------------------------

export function getTenantStoreState(): TenantStore {
  return getTenantStore().getState();
}

export function getActiveTenant(): TenantDefinition | null {
  return getTenantStore().getState().activeTenant;
}

export function getAvailableTenants(): TenantDefinition[] {
  return getTenantStore().getState().availableTenants;
}

export function getTenantSystemMode(): TenantMode {
  return getTenantStore().getState().mode;
}

/**
 * S'abonne aux changements d'état du store.
 * Retourne une fonction de désabonnement.
 */
export function subscribeTenantStore(listener: (state: TenantStore) => void): () => void {
  return getTenantStore().subscribe(listener);
}
