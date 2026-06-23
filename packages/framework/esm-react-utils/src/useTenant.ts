// ============================================================================
//  @egen/esm-react-utils — Re-export des hooks tenant
// ============================================================================
//
//  Les hooks tenant sont définis dans @egen/esm-tenant mais exposés ici
//  pour que les apps puissent tout importer depuis @egen/esm-framework
//  (ou @egen/esm-react-utils) sans dépendance directe sur esm-tenant.
//
//  C'est exactement le même pattern que :
//   - useFeatureFlag  → importé de @egen/esm-feature-flags, réexporté ici
//   - useSession      → défini ici, consomme @egen/esm-api
//
//  USAGE APPS :
//  ```tsx
//  import {
//    useTenant, useTenantMode, useTenantAccess,
//    useAvailableTenants, useSwitchTenant,
//    useTenantFeatureFlag, useTenantPermission,
//    TenantProvider, TenantGuard, TenantRequired,
//    TenantSelector, TenantSuspendedBoundary,
//  } from '@egen/esm-framework';
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
  useTenantLocale,
  useTenantTimezone,
  // Composants
  TenantProvider,
  TenantGuard,
  TenantRequired,
  TenantSuspendedBoundary,
  TenantSelector,
  useTenantContext,
} from '@egen/esm-tenant';

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
} from '@egen/esm-tenant';
