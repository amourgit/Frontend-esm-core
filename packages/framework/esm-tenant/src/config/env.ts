// ============================================================================
//  @egen/esm-tenant — Résolution de la configuration depuis l'environnement
// ============================================================================
//
//  Ce module lit les variables de contrôle depuis :
//  1. Variables d'environnement de build (Vite/Webpack : import.meta.env.VITE_*)
//  2. Variables globales window (injectées par le serveur dans index.html)
//  3. Valeurs par défaut intégrées
//
//  VARIABLES SUPPORTÉES :
//  ──────────────────────
//
//  VITE_TENANT_MODE / window.eigenTenantMode
//    "off" | "single" | "multi"
//    Contrôle global du système. "off" = système complètement désactivé.
//
//  VITE_TENANT_ID / window.eigenTenantId
//    string
//    En mode "single", identifiant du tenant forcé.
//
//  VITE_TENANT_REGISTRY_URL / window.eigenTenantRegistryUrl
//    string (URL)
//    URL d'un JSON de registry de tenants (TenantDefinition[]).
//
//  VITE_TENANT_THEME_APPLY / window.eigenTenantApplyTheme
//    "true" | "false"
//    Active/désactive l'application automatique du thème tenant. Défaut: "true".
//
//  VITE_TENANT_PERSIST / window.eigenTenantPersist
//    "true" | "false"
//    Active/désactive la persistance localStorage du tenant actif. Défaut: "true".
//
//  VITE_TENANT_RESOLUTION_ORDER / window.eigenTenantResolutionOrder
//    string (CSV) ex: "subdomain,jwt,localStorage"
//    Ordre des stratégies de résolution.
//
//  VITE_TENANT_PATH_PREFIX / window.eigenTenantPathPrefix
//    string ex: "/t/"
//    Préfixe de path pour la stratégie de résolution "path".
//
//  VITE_TENANT_JWT_CLAIM / window.eigenTenantJwtClaim
//    string ex: "tenantId" | "tid" | "org"
//    Nom du claim JWT portant l'ID tenant.
// ============================================================================

import type { TenantMode, TenantResolutionStrategy, TenantSystemConfig } from '../types';

// Helpers pour lire les deux sources (env build + window runtime)
const env = (key: string): string | undefined => {
  // Vite
  if (typeof import.meta !== 'undefined') {
    const metaEnv = (import.meta as unknown as { env?: Record<string, string | undefined> }).env;
    if (metaEnv) {
      const v = metaEnv[key];
      if (v !== undefined && v !== '') return v;
    }
  }
  return undefined;
};

const win = (key: string): string | undefined => {
  if (typeof window === 'undefined') return undefined;
  const v = (window as unknown as Record<string, unknown>)[key];
  if (v !== undefined && v !== null && v !== '') return String(v);
  return undefined;
};

/** Lit une valeur de config en cherchant d'abord dans window, puis dans import.meta.env */
function readConfig(windowKey: string, envKey: string): string | undefined {
  return win(windowKey) ?? env(envKey);
}

function parseBool(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined) return fallback;
  return value.toLowerCase() !== 'false' && value !== '0';
}

function parseTenantMode(value: string | undefined): TenantMode {
  if (value === 'single' || value === 'multi' || value === 'off') return value;
  return 'off';
}

function parseResolutionOrder(value: string | undefined): TenantResolutionStrategy[] | undefined {
  if (!value) return undefined;
  const valid: TenantResolutionStrategy[] = [
    'subdomain',
    'path',
    'query',
    'jwt',
    'header',
    'localStorage',
    'static',
    'first',
  ];
  const parsed = value
    .split(',')
    .map((s) => s.trim() as TenantResolutionStrategy)
    .filter((s) => valid.includes(s));
  return parsed.length > 0 ? parsed : undefined;
}

/**
 * Résout la configuration du système tenant depuis les variables d'environnement
 * et les globals window. Les valeurs lues ici sont des valeurs par défaut qui
 * peuvent être surchargées par la config passée à `setupTenantSystem()`.
 *
 * Priorité pour chaque option :
 *   1. window.eigenXxx  (injection runtime par le serveur)
 *   2. import.meta.env.VITE_XXX  (injection build time)
 *   3. Valeur par défaut codée ici
 */
export function resolveConfigFromEnv(): Partial<TenantSystemConfig> {
  const mode = parseTenantMode(readConfig('eigenTenantMode', 'VITE_TENANT_MODE'));
  const defaultTenantId = readConfig('eigenTenantId', 'VITE_TENANT_ID');
  const registryUrl = readConfig('eigenTenantRegistryUrl', 'VITE_TENANT_REGISTRY_URL');
  const applyTheme = parseBool(readConfig('eigenTenantApplyTheme', 'VITE_TENANT_THEME_APPLY'), true);
  const persistActive = parseBool(readConfig('eigenTenantPersist', 'VITE_TENANT_PERSIST'), true);
  const resolutionOrder = parseResolutionOrder(
    readConfig('eigenTenantResolutionOrder', 'VITE_TENANT_RESOLUTION_ORDER'),
  );
  const pathPrefix = readConfig('eigenTenantPathPrefix', 'VITE_TENANT_PATH_PREFIX');
  const jwtClaim = readConfig('eigenTenantJwtClaim', 'VITE_TENANT_JWT_CLAIM');

  const config: Partial<TenantSystemConfig> = {
    mode,
    applyTheme,
    persistActive,
  };

  if (defaultTenantId) config.defaultTenantId = defaultTenantId;
  if (registryUrl) config.registryUrl = registryUrl;
  if (resolutionOrder) config.resolutionOrder = resolutionOrder;
  if (pathPrefix) config.pathConfig = { prefix: pathPrefix };
  if (jwtClaim) config.jwtConfig = { claim: jwtClaim };

  return config;
}

/**
 * Retourne true si le système tenant est activé selon la configuration
 * d'environnement (avant même que `setupTenantSystem()` ait été appelé).
 * Utile pour des décisions de branching très précoces (ex: dans index.html).
 */
export function isTenantModeEnabledFromEnv(): boolean {
  const mode = parseTenantMode(readConfig('eigenTenantMode', 'VITE_TENANT_MODE'));
  return mode !== 'off';
}
