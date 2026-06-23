// ============================================================================
//  @eigen/esm-react-utils — Re-export des hooks tenant
// ============================================================================
//
//  Les hooks tenant sont définis dans @eigen/esm-tenant mais exposés ici
//  pour que les apps puissent tout importer depuis @eigen/esm-framework
//  (ou @eigen/esm-react-utils) sans dépendance directe sur esm-tenant.
//
//  C'est exactement le même pattern que :
//   - useFeatureFlag  → importé de @eigen/esm-feature-flags, réexporté ici
//   - useSession      → défini ici, consomme @eigen/esm-api
//
//  USAGE APPS :
//  ```tsx
//  import {
//    useTenant, useTenantMode, useTenantAccess,
//    useAvailableTenants, useSwitchTenant,
//    useTenantFeatureFlag, useTenantPermission,
//    TenantProvider, TenantGuard, TenantRequired,
//    TenantSelector, TenantSuspendedBoundary,
//  } from '@eigen/esm-framework';
//  ```
// ============================================================================

/** @module @category Tenant */
export {
  // Hooks d'état
  useTenant,
  useTenantMode,
  useTenantStatus,
  useAvailableTenants,
  useIsMultiTenant,
  useSwitchTenant,
  // Hooks de contrôle d'accès
  useTenantAccess,
  useTenantMeta,
  useTenantFeatureFlag,
  useTenantPermission,
  useTenantIsSuspended,
  useTenantApiBaseUrl,
  // Composants
  TenantProvider,
  TenantGuard,
  TenantRequired,
  TenantSuspendedBoundary,
  TenantSelector,
  useTenantContext,
} from '@eigen/esm-tenant';

export type {
  TenantDefinition,
  TenantMode,
  TenantStatus,
  TenantSystemConfig,
  TenantAccessOptions,
  TenantAccessResult,
  TenantProviderProps,
  TenantGuardProps,
  TenantRequiredProps,
  TenantSuspendedBoundaryProps,
  TenantSelectorProps,
  TenantSelectorRenderProps,
} from '@eigen/esm-tenant';
