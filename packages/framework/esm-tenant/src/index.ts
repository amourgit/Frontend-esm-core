// ============================================================================
//  @egen/esm-tenant — Point d'entrée public
// ============================================================================
//
//  Ce fichier expose UNIQUEMENT l'API publique stable du package.
//  Les imports internes (context/, config/, utils/) sont des détails
//  d'implémentation et ne doivent pas être importés directement par les apps.
//
//  USAGE RECOMMANDÉ DANS UNE APP :
//  ─────────────────────────────────
//  import {
//    // React hooks
//    useTenant, useTenantMode, useTenantAccess, useAvailableTenants,
//    useSwitchTenant, useTenantFeatureFlag, useTenantPermission,
//    // React components
//    TenantProvider, TenantGuard, TenantRequired, TenantSelector,
//    TenantSuspendedBoundary,
//    // API non-React (services, intercepteurs)
//    getCurrentTenant, getCurrentTenantId, getTenantApiBaseUrl,
//    getTenantHeaders, fetchWithTenant, isTenantSystemActive,
//    tenantHasFeatureFlag, tenantHasPermission, onTenantChange,
//    // Config par app
//    registerAppTenantConfig,
//    // Setup (shell uniquement)
//    setupTenantSystem, switchTenant, reloadTenantRegistry,
//    registerTenantThemeApplier,
//  } from '@egen/esm-tenant';
// ============================================================================

// ── Types ──────────────────────────────────────────────────────────────────
export type {
  TenantId,
  TenantMode,
  TenantStatus,
  TenantDefinition,
  TenantSystemConfig,
  TenantStore,
  TenantAccessOptions,
  TenantAccessResult,
  TenantActivatedEvent,
  TenantChangedEvent,
  TenantResolutionStrategy,
  TenantPathConfig,
  TenantJwtConfig,
} from './types';

export type { AppTenantConfig } from './config/app-config';

// ── Setup (shell) ──────────────────────────────────────────────────────────
export {
  setupTenantSystem,
  switchTenant,
  reloadTenantRegistry,
  registerTenantThemeApplier,
  storeHeaderTenantId,
  registerTenant,
} from './setup';

// ── React Hooks ────────────────────────────────────────────────────────────
export {
  useTenant,
  useTenantMode,
  useTenantStatus,
  useAvailableTenants,
  useIsMultiTenant,
  useSwitchTenant,
  useTenantAccess,
  useTenantMeta,
  useTenantFeatureFlag,
  useTenantPermission,
  useTenantIsSuspended,
  useTenantApiBaseUrl,
  useTenantLocale,
  useTenantTimezone,
} from './hooks/useTenant';

// ── React Components ───────────────────────────────────────────────────────
export {
  TenantProvider,
  TenantGuard,
  TenantRequired,
  TenantSuspendedBoundary,
  TenantSelector,
  useTenantContext,
} from './hooks/TenantProvider';

export type {
  TenantProviderProps,
  TenantGuardProps,
  TenantRequiredProps,
  TenantSuspendedBoundaryProps,
  TenantSelectorProps,
  TenantSelectorRenderProps,
} from './hooks/TenantProvider';

// ── API non-React (services, intercepteurs, utilitaires) ──────────────────
export {
  getCurrentTenant,
  getCurrentTenantId,
  getTenantApiBaseUrl,
  getTenantDefinition,
  isTenantSystemActive,
  isMultiTenantMode,
  isTenantActive,
  tenantHasFeatureFlag,
  tenantHasPermission,
  onTenantChange,
  buildTenantUrl,
  getTenantHeaders,
  fetchWithTenant,
} from './utils/tenant-utils';

// ── Config par app ─────────────────────────────────────────────────────────
export {
  registerAppTenantConfig,
  getAppTenantConfig,
  getAllAppTenantConfigs,
  checkAppTenantRequirements,
} from './config/app-config';

// ── Store (accès direct via useStore(tenantStore) dans esm-react-utils) ─────
// Usage: import { tenantStore } from '@egen/esm-tenant';
//        import { useStore } from '@egen/esm-react-utils';
//        const { activeTenant, mode, availableTenants } = useStore(tenantStore);
export {
  tenantStore,
  getTenantStoreState,
  getActiveTenant,
  getAvailableTenants,
  getTenantSystemMode,
  subscribeTenantStore,
} from './context/store';

// ── Registry (accès bas niveau) ────────────────────────────────────────────
export { getAllTenants, getTenantById, getTenantByDomain, isTenantRegistryLoaded } from './context/registry';

// ── Résolution d'environnement ─────────────────────────────────────────────
export { resolveConfigFromEnv, isTenantModeEnabledFromEnv } from './config/env';

// ── Utilitaires de domaine (hostname ↔ tenant) ─────────────────────────────
// Source unique de vérité — voir utils/domain-utils.ts. À utiliser par toute
// app qui doit construire ou analyser une URL de sous-domaine tenant (garde
// de routage, sélecteur de tenant, etc.) plutôt que de réimplémenter la
// même heuristique localement.
export {
  isLocalhostOrIp,
  inferRootDomain,
  extractSubdomain,
  buildTenantSubdomainUrl,
} from './utils/domain-utils';
