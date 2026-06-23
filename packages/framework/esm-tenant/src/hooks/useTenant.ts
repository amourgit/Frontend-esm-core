// ============================================================================
//  @egen/esm-tenant — Hooks React
// ============================================================================
//
//  Tous les hooks suivent le même pattern que les hooks EGEN existants
//  (useFeatureFlag, useSession, useStore) pour une cohérence maximale.
//
//  USAGE DANS UNE APP MICROFRONTEND :
//  ───────────────────────────────────
//  ```tsx
//  import {
//    useTenant,
//    useTenantMode,
//    useTenantAccess,
//    useAvailableTenants,
//    useSwitchTenant,
//  } from '@egen/esm-tenant';
//
//  function MyPage() {
//    const tenant = useTenant();
//    const { allowed, reason } = useTenantAccess({ appName: 'egen-academique' });
//    if (!allowed) return <AccessDenied reason={reason} />;
//    return <div>Bienvenue dans {tenant?.name}</div>;
//  }
//  ```
// ============================================================================

/** @module @category Tenant */

import { useState, useEffect, useCallback } from 'react';
import type {
  TenantDefinition,
  TenantMode,
  TenantStatus,
  TenantStore,
  TenantAccessOptions,
  TenantAccessResult,
} from '../types';
import {
  tenantStore,
  getActiveTenant,
  getAvailableTenants,
  getTenantSystemMode,
} from '../context/store';
import { switchTenant } from '../setup';

// ---------------------------------------------------------------------------
// Hook bas niveau : abonnement direct au store (sans dépendance circulaire
// vers esm-react-utils — esm-tenant est un package plus bas dans la chaîne)
// ---------------------------------------------------------------------------

function useTenantStoreSelector<T>(select: (state: ReturnType<typeof tenantStore.getState>) => T): T {
  const [value, setValue] = useState<T>(() => select(tenantStore.getState()));

  useEffect(() => {
    // Sync initiale (cas où le store a muté entre le render et l'effet)
    setValue(select(tenantStore.getState()));
    return tenantStore.subscribe((state) => {
      setValue(select(state));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return value;
}

// ---------------------------------------------------------------------------
// Hooks publics
// ---------------------------------------------------------------------------

/**
 * Retourne le tenant actuellement actif, ou `null` si aucun n'est résolu.
 * Réactif : re-rend le composant à chaque changement de tenant actif.
 *
 * @returns TenantDefinition | null
 * @category Tenant
 *
 * @example
 * ```tsx
 * import { useTenant } from '@egen/esm-framework';
 *
 * function Header() {
 *   const tenant = useTenant();
 *   return <h1>{tenant?.name ?? 'Application'}</h1>;
 * }
 * ```
 */
export function useTenant(): TenantDefinition | null {
  return useTenantStoreSelector((s) => s.activeTenant);
}

/**
 * Retourne le mode de fonctionnement actif du système tenant.
 * @returns `"off"` | `"single"` | `"multi"`
 * @category Tenant
 */
export function useTenantMode(): TenantMode {
  return useTenantStoreSelector((s) => s.mode);
}

/**
 * Retourne le statut courant du système tenant.
 * @returns `"idle"` | `"loading"` | `"active"` | `"error"` | `"suspended"`
 * @category Tenant
 */
export function useTenantStatus(): TenantStatus {
  return useTenantStoreSelector((s) => s.status);
}

/**
 * Retourne tous les tenants disponibles dans la registry.
 * Utile pour afficher un sélecteur en mode "multi".
 * @category Tenant
 */
export function useAvailableTenants(): TenantDefinition[] {
  return useTenantStoreSelector((s) => s.availableTenants);
}

/**
 * Retourne `true` si le système est en mode "multi" avec plusieurs tenants.
 * @category Tenant
 */
export function useIsMultiTenant(): boolean {
  return useTenantStoreSelector((s) => s.mode === 'multi' && s.availableTenants.length > 1);
}

/**
 * Retourne une fonction pour changer de tenant depuis l'UI, ainsi qu'un
 * état `switching` pendant la transition.
 *
 * @category Tenant
 * @example
 * ```tsx
 * import { useSwitchTenant } from '@egen/esm-framework';
 *
 * function TenantSwitcher({ targetId }: { targetId: string }) {
 *   const { switchTo, switching } = useSwitchTenant();
 *   return (
 *     <button onClick={() => switchTo(targetId)} disabled={switching}>
 *       Changer de tenant
 *     </button>
 *   );
 * }
 * ```
 */
export function useSwitchTenant(): {
  switchTo: (tenantId: string) => Promise<void>;
  switching: boolean;
} {
  const [switching, setSwitching] = useState(false);

  const switchTo = useCallback(async (tenantId: string) => {
    setSwitching(true);
    try {
      await switchTenant(tenantId);
    } finally {
      setSwitching(false);
    }
  }, []);

  return { switchTo, switching };
}

/**
 * Vérifie si l'accès à une ressource est autorisé pour le tenant actif.
 *
 * Règles vérifiées dans l'ordre :
 * 1. Mode "off" → autorisé (sauf si `requireTenant: true`)
 * 2. Aucun tenant résolu → refusé (reason: "no-tenant")
 * 3. Tenant suspendu → refusé (reason: "tenant-suspended")
 * 4. `appName` absent de `tenant.allowedApps` → refusé (reason: "app-not-allowed")
 * 5. `permission` absente de `tenant.permissions` → refusé (reason: "permission-denied")
 *
 * @category Tenant
 * @example
 * ```tsx
 * const { allowed, reason } = useTenantAccess({ appName: 'egen-academique' });
 * if (!allowed) return <TenantDenied reason={reason} />;
 * ```
 */
export function useTenantAccess(options: TenantAccessOptions = {}): TenantAccessResult {
  const mode = useTenantMode();
  const tenant = useTenant();
  const status = useTenantStatus();
  const { appName, permission, requireTenant = false } = options;

  if (mode === 'off') {
    if (requireTenant) return { allowed: false, reason: 'mode-off', tenant: null };
    return { allowed: true, tenant: null };
  }

  if (status === 'loading') return { allowed: false, reason: 'no-tenant', tenant: null };
  if (!tenant) return { allowed: false, reason: 'no-tenant', tenant: null };
  if (tenant.suspended) return { allowed: false, reason: 'tenant-suspended', tenant };

  if (appName && tenant.allowedApps !== undefined) {
    if (!tenant.allowedApps.includes(appName)) {
      return { allowed: false, reason: 'app-not-allowed', tenant };
    }
  }

  if (permission && tenant.permissions !== undefined) {
    const perm = tenant.permissions[permission];
    if (perm === false || perm === undefined) {
      return { allowed: false, reason: 'permission-denied', tenant };
    }
  }

  return { allowed: true, tenant };
}

/**
 * Retourne la valeur d'un champ des métadonnées du tenant actif.
 * @category Tenant
 * @example
 * ```tsx
 * const logoUrl = useTenantMeta<string>('logoUrl');
 * ```
 */
export function useTenantMeta<T = unknown>(key: string): T | undefined {
  return useTenantStoreSelector((s) => s.activeTenant?.meta?.[key] as T | undefined);
}

/**
 * Retourne la valeur d'un feature flag du tenant actif.
 * Retourne `defaultValue` si le flag est absent ou si mode est "off".
 * @category Tenant
 * @example
 * ```tsx
 * const hasBilling = useTenantFeatureFlag('billing');
 * ```
 */
export function useTenantFeatureFlag(flagName: string, defaultValue = false): boolean {
  return useTenantStoreSelector((s) => s.activeTenant?.featureFlags?.[flagName] ?? defaultValue);
}

/**
 * Retourne la valeur d'une permission du tenant actif.
 * @category Tenant
 */
export function useTenantPermission(key: string): boolean | string[] | undefined {
  return useTenantStoreSelector((s) => s.activeTenant?.permissions?.[key]);
}

/**
 * Retourne true si le tenant actif est suspendu.
 * @category Tenant
 */
export function useTenantIsSuspended(): { suspended: boolean; message?: string } {
  return useTenantStoreSelector((s) => ({
    suspended: s.activeTenant?.suspended === true,
    message: s.activeTenant?.suspendedMessage,
  }));
}

/**
 * Retourne la locale du tenant actif (ex: "fr-GA", "en-US").
 * Utile pour initialiser i18n ou formatter les dates selon le tenant.
 * @category Tenant
 */
export function useTenantLocale(): string | undefined {
  return useTenantStoreSelector((s) => s.activeTenant?.locale);
}

/**
 * Retourne le fuseau horaire du tenant actif (ex: "Africa/Libreville").
 * @category Tenant
 */
export function useTenantTimezone(): string | undefined {
  return useTenantStoreSelector((s) => s.activeTenant?.timezone);
}

/**
 * Retourne l'URL de l'API backend du tenant actif.
 * Retourne `undefined` en mode "off" ou si non configurée.
 * @category Tenant
 * @example
 * ```tsx
 * const apiBase = useTenantApiBaseUrl() ?? window.egenBase;
 * ```
 */
export function useTenantApiBaseUrl(): string | undefined {
  return useTenantStoreSelector((s) => s.activeTenant?.apiBaseUrl);
}
