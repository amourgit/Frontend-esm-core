// ============================================================================
//  @egen/esm-tenant — Configuration décentralisée par application
// ============================================================================
//
//  Ce module permet à chaque app microfrontend de déclarer sa propre
//  configuration tenant SANS avoir besoin de toucher à la config globale
//  du shell. C'est l'équivalent, pour le tenant, de ce que `useConfig()`
//  est pour la config EGEN.
//
//  DEUX MODES D'UTILISATION :
//  ───────────────────────────
//
//  1. DÉCLARATIF (recommandé, dans le routes.json de l'app) :
//     L'app déclare ses besoins tenant dans son fichier de routes :
//     ```json
//     {
//       "tenant": {
//         "requiredApp": "egen-academique",
//         "requiredPermissions": ["manage-students"],
//         "allowInSingleMode": true
//       }
//     }
//     ```
//
//  2. PROGRAMMATIQUE (dans le run.ts de l'app) :
//     ```ts
//     import { registerAppTenantConfig } from '@egen/esm-tenant';
//
//     registerAppTenantConfig('egen-academique', {
//       requiredApp: 'egen-academique',
//       requiredPermissions: ['manage-students'],
//     });
//     ```
//
//  Les guards et hooks liront automatiquement cette config quand `appName`
//  n'est pas fourni explicitement.
// ============================================================================

import type { TenantDefinition } from '../types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AppTenantConfig {
  /**
   * Nom de l'app à vérifier dans `tenant.allowedApps`.
   * Si non défini, la vérification `allowedApps` est ignorée.
   */
  requiredApp?: string;

  /**
   * Permissions requises (toutes doivent être présentes dans `tenant.permissions`).
   */
  requiredPermissions?: string[];

  /**
   * Si true, l'app fonctionne même en mode "single" sans vérification.
   * @default true
   */
  allowInSingleMode?: boolean;

  /**
   * Si true, l'app peut fonctionner quand le mode est "off".
   * @default true
   */
  allowWhenModeOff?: boolean;

  /**
   * Feature flags requis pour que l'app soit accessible.
   * Si un flag est absent ou false dans le tenant, l'accès est refusé.
   */
  requiredFeatureFlags?: string[];

  /**
   * Callback appelé quand le tenant actif change pendant la durée de vie de l'app.
   * Utile pour des rechargements de données côté app.
   */
  onTenantChange?: (tenant: TenantDefinition | null) => void;
}

// ---------------------------------------------------------------------------
// Registry des configs par app
// ---------------------------------------------------------------------------

const _appConfigs = new Map<string, AppTenantConfig>();

/**
 * Enregistre la configuration tenant d'une app microfrontend.
 * À appeler dans le run.ts de l'app, au boot.
 *
 * @param appName Nom de l'app (identifiant unique, ex: "@egen/esm-academique-app")
 * @param config Configuration tenant de l'app
 */
export function registerAppTenantConfig(appName: string, config: AppTenantConfig): void {
  _appConfigs.set(appName, config);
}

/**
 * Retourne la configuration tenant d'une app spécifique.
 */
export function getAppTenantConfig(appName: string): AppTenantConfig | undefined {
  return _appConfigs.get(appName);
}

/**
 * Retourne toutes les configs d'apps enregistrées.
 * Utile pour les outils de debug / implementer tools.
 */
export function getAllAppTenantConfigs(): Map<string, AppTenantConfig> {
  return new Map(_appConfigs);
}

// ---------------------------------------------------------------------------
// Validation d'accès depuis la config d'app
// ---------------------------------------------------------------------------

/**
 * Vérifie si un tenant satisfait les exigences d'une AppTenantConfig.
 * Retourne une raison en cas de refus, undefined si tout est OK.
 */
export function checkAppTenantRequirements(
  tenant: TenantDefinition | null,
  config: AppTenantConfig,
  mode: 'off' | 'single' | 'multi',
): { denied: true; reason: string } | { denied: false } {
  // Mode "off" : tout passe sauf si explicitement interdit
  if (mode === 'off' && config.allowWhenModeOff !== false) {
    return { denied: false };
  }

  // Mode "single" : allégement des vérifications si allowInSingleMode
  if (mode === 'single' && config.allowInSingleMode !== false) {
    return { denied: false };
  }

  if (!tenant) {
    return { denied: true, reason: 'no-tenant' };
  }

  if (tenant.suspended) {
    return { denied: true, reason: 'tenant-suspended' };
  }

  // Vérification allowedApps
  if (config.requiredApp && tenant.allowedApps !== undefined) {
    if (!tenant.allowedApps.includes(config.requiredApp)) {
      return { denied: true, reason: `App "${config.requiredApp}" non autorisée pour ce tenant` };
    }
  }

  // Vérification permissions
  if (config.requiredPermissions?.length) {
    for (const perm of config.requiredPermissions) {
      const value = tenant.permissions?.[perm];
      if (value === false || value === undefined) {
        return { denied: true, reason: `Permission "${perm}" manquante pour ce tenant` };
      }
    }
  }

  // Vérification feature flags
  if (config.requiredFeatureFlags?.length) {
    for (const flag of config.requiredFeatureFlags) {
      if (!tenant.featureFlags?.[flag]) {
        return { denied: true, reason: `Feature flag "${flag}" non activé pour ce tenant` };
      }
    }
  }

  return { denied: false };
}
