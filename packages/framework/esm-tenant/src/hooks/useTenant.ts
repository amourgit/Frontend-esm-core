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

import { useState, useEffect, useCallback } from 'react';
import type {
  TenantDefinition,
  TenantMode,
  TenantStatus,
  TenantStore,
  TenantAccessOptions,
  TenantAccessResult,
} from '../types';
import { getTenantStore, getActiveTenant, getAvailableTenants, getTenantSystemMode } from '../context/store';
import { switchTenant } from '../setup';

// ---------------------------------------------------------------------------
// Hook bas niveau : useStore (même pattern qu'esm-state/useStore.ts)
// ---------------------------------------------------------------------------

function useTenantStoreState(): TenantStore {
  const [state, setState] = useState<TenantStore>(() => getTenantStore().getState());

  useEffect(() => {
    // Synchronisation initiale (cas où le store a changé entre le render et l'effet)
    setState(getTenantStore().getState());
    // Abonnement aux changements
    return getTenantStore().subscribe(setState);
  }, []);

  return state;
}

// ---------------------------------------------------------------------------
// Hooks publics
// ---------------------------------------------------------------------------

/**
 * Retourne le tenant actuellement actif, ou `null` si aucun n'est résolu
 * (mode "off", ou résolution en cours).
 *
 * @example
 * ```tsx
 * const tenant = useTenant();
 * return <h1>{tenant?.name ?? 'Application'}</h1>;
 * ```
 */
export function useTenant(): TenantDefinition | null {
  const state = useTenantStoreState();
  return state.activeTenant;
}

/**
 * Retourne le mode de fonctionnement actif du système tenant.
 *
 * @returns `"off"` | `"single"` | `"multi"`
 */
export function useTenantMode(): TenantMode {
  const state = useTenantStoreState();
  return state.mode;
}

/**
 * Retourne le statut courant du système tenant.
 */
export function useTenantStatus(): TenantStatus {
  const state = useTenantStoreState();
  return state.status;
}

/**
 * Retourne tous les tenants disponibles dans la registry.
 * Utile pour afficher un sélecteur de tenant (mode "multi").
 */
export function useAvailableTenants(): TenantDefinition[] {
  const state = useTenantStoreState();
  return state.availableTenants;
}

/**
 * Retourne `true` si le système tenant est en mode "multi" et
 * qu'il y a plus d'un tenant disponible.
 */
export function useIsMultiTenant(): boolean {
  const state = useTenantStoreState();
  return state.mode === 'multi' && state.availableTenants.length > 1;
}

/**
 * Retourne une fonction `switchTenant(id)` pour changer de tenant
 * depuis l'UI, ainsi qu'un état `switching` indiquant si le changement
 * est en cours.
 *
 * @example
 * ```tsx
 * const { switchTo, switching } = useSwitchTenant();
 * return <button onClick={() => switchTo('acme')} disabled={switching}>
 *   Passer sur ACME
 * </button>;
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
 * Vérifie si l'app courante a accès au tenant actif.
 *
 * Règles vérifiées :
 *  1. Si mode "off" et `requireTenant: false` (défaut) → autorisé
 *  2. Si le tenant est `suspended` → refusé (reason: "tenant-suspended")
 *  3. Si `appName` est fourni et absent de `tenant.allowedApps` → refusé
 *  4. Si `permission` est fournie et absente de `tenant.permissions` → refusé
 *
 * @example
 * ```tsx
 * const { allowed, reason } = useTenantAccess({ appName: 'egen-academique' });
 * if (!allowed) return <TenantDenied reason={reason} />;
 * ```
 */
export function useTenantAccess(options: TenantAccessOptions = {}): TenantAccessResult {
  const state = useTenantStoreState();
  const { appName, permission, requireTenant = false } = options;

  // Mode "off" : tout est permis sauf si requireTenant est explicite
  if (state.mode === 'off') {
    if (requireTenant) {
      return { allowed: false, reason: 'mode-off', tenant: null };
    }
    return { allowed: true, tenant: null };
  }

  const tenant = state.activeTenant;

  // Pas encore de tenant résolu
  if (!tenant) {
    return { allowed: false, reason: 'no-tenant', tenant: null };
  }

  // Tenant suspendu
  if (tenant.suspended) {
    return { allowed: false, reason: 'tenant-suspended', tenant };
  }

  // Vérification allowedApps
  if (appName && tenant.allowedApps !== undefined) {
    if (!tenant.allowedApps.includes(appName)) {
      return { allowed: false, reason: 'app-not-allowed', tenant };
    }
  }

  // Vérification permissions granulaires
  if (permission && tenant.permissions !== undefined) {
    const perm = tenant.permissions[permission];
    if (perm === false || perm === undefined) {
      return { allowed: false, reason: 'permission-denied', tenant };
    }
  }

  return { allowed: true, tenant };
}

/**
 * Retourne un champ spécifique des métadonnées du tenant actif.
 *
 * @example
 * ```tsx
 * const logoUrl = useTenantMeta<string>('logoUrl');
 * ```
 */
export function useTenantMeta<T = unknown>(key: string): T | undefined {
  const tenant = useTenant();
  return tenant?.meta?.[key] as T | undefined;
}

/**
 * Retourne la valeur d'un feature flag du tenant actif.
 * Si le mode est "off" ou que le flag n'est pas défini dans le tenant,
 * retourne `defaultValue` (défaut: `false`).
 *
 * @example
 * ```tsx
 * const hasBilling = useTenantFeatureFlag('billing');
 * ```
 */
export function useTenantFeatureFlag(flagName: string, defaultValue = false): boolean {
  const tenant = useTenant();
  if (!tenant?.featureFlags) return defaultValue;
  return tenant.featureFlags[flagName] ?? defaultValue;
}

/**
 * Retourne les permissions du tenant actif pour une clé donnée.
 *
 * @example
 * ```tsx
 * const allowedRoles = useTenantPermission('manage-users'); // string[] | boolean | undefined
 * ```
 */
export function useTenantPermission(key: string): boolean | string[] | undefined {
  const tenant = useTenant();
  return tenant?.permissions?.[key];
}

/**
 * Retourne true si le tenant actif est suspendu.
 * Utile pour afficher une page de maintenance.
 */
export function useTenantIsSuspended(): { suspended: boolean; message?: string } {
  const tenant = useTenant();
  return {
    suspended: tenant?.suspended === true,
    message: tenant?.suspendedMessage,
  };
}

/**
 * Retourne l'URL de l'API backend propre au tenant actif.
 * Utile pour les apps qui doivent pointer vers un backend isolé par tenant.
 * Retourne `undefined` en mode "off" ou si non configuré (utiliser l'API globale).
 */
export function useTenantApiBaseUrl(): string | undefined {
  const tenant = useTenant();
  return tenant?.apiBaseUrl;
}
