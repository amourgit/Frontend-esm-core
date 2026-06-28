// ============================================================================
//  @egen/esm-tenant — Stratégies de résolution du tenant actif
// ============================================================================
//
//  Chaque stratégie tente de résoudre un TenantId depuis une source.
//  Retourne undefined si la source n'est pas disponible ou n'est pas
//  pertinente pour l'environnement courant.
//
//  ORDRE PAR DÉFAUT (du plus spécifique au plus générique) :
//  1. subdomain  — le plus déterministe, sans ambiguïté
//  2. path       — clair mais nécessite une config de routing côté app
//  3. query      — utile pour le dev / preview
//  4. jwt        — lecture du claim dans le token de session
//  5. header     — propagé par le backend lors du login
//  6. localStorage — survie aux rechargements
//  7. static     — config globale window / env
//  8. first      — dernier recours (premier tenant disponible)
// ============================================================================

import type { TenantId, TenantResolutionStrategy, TenantSystemConfig } from '../types';
import { getAllTenants, getTenantByDomain, getTenantById } from './registry';

// ---------------------------------------------------------------------------
// Stratégies individuelles
// ---------------------------------------------------------------------------

/** Résolution par subdomain de window.location.hostname */
function resolveBySubdomain(): TenantId | undefined {
  if (typeof window === 'undefined') return undefined;
  const hostname = window.location.hostname;
  const tenant = getTenantByDomain(hostname);
  return tenant?.id;
}

/** Résolution par segment de path URL */
function resolveByPath(config?: TenantSystemConfig['pathConfig']): TenantId | undefined {
  if (typeof window === 'undefined') return undefined;
  const prefix = config?.prefix ?? '/t/';
  const pathname = window.location.pathname;

  if (prefix && pathname.startsWith(prefix)) {
    const rest = pathname.slice(prefix.length);
    const slug = rest.split('/')[0];
    if (slug) {
      const tenant = getTenantById(slug);
      return tenant?.id ?? slug;
    }
  }

  // Stratégie segment (sans préfixe)
  const segment = config?.segment ?? 0;
  const parts = pathname.split('/').filter(Boolean);
  const slug = parts[segment];
  if (slug) {
    const tenant = getTenantById(slug);
    if (tenant) return tenant.id;
  }

  return undefined;
}

/** Résolution par query param ?tenant= */
function resolveByQuery(): TenantId | undefined {
  if (typeof window === 'undefined') return undefined;
  const params = new URLSearchParams(window.location.search);
  const value = params.get('tenant') ?? params.get('tenantId') ?? params.get('tid');
  if (!value) return undefined;
  const tenant = getTenantById(value);
  return tenant?.id ?? value;
}

/** Résolution depuis le header HTTP X-Tenant-ID (posé en localStorage lors du login) */
function resolveByHeader(storageKey: string): TenantId | undefined {
  if (typeof window === 'undefined') return undefined;
  try {
    const value = window.localStorage.getItem(`${storageKey}:header`);
    if (!value) return undefined;
    const tenant = getTenantById(value);
    return tenant?.id ?? value;
  } catch {
    return undefined;
  }
}

/**
 * Résolution depuis un claim JWT.
 * Le JWT est lu depuis le sessionStorage (format: "Bearer <token>") ou
 * depuis localStorage (clé : "egen:session:token").
 * On ne fait QUE lire le payload — aucune vérification de signature côté frontend.
 */
function resolveByJwt(jwtConfig?: TenantSystemConfig['jwtConfig']): TenantId | undefined {
  const claim = jwtConfig?.claim ?? 'tenantId';
  const token = readTokenFromStorage();
  if (!token) return undefined;

  try {
    const payload = parseJwtPayload(token);
    const value = payload?.[claim] ?? payload?.['tid'] ?? payload?.['tenant_id'];
    if (!value) return undefined;
    const tenant = getTenantById(String(value));
    return tenant?.id ?? String(value);
  } catch {
    return undefined;
  }
}

function readTokenFromStorage(): string | undefined {
  if (typeof window === 'undefined') return undefined;
  try {
    const candidates = [
      localStorage.getItem('egen:session:token'),
      sessionStorage.getItem('egen:session:token'),
      localStorage.getItem('token'),
    ];
    for (const candidate of candidates) {
      if (candidate) return candidate.replace(/^Bearer\s+/i, '');
    }
  } catch {
    // Accès storage refusé
  }
  return undefined;
}

function parseJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const padded = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const json = atob(padded + '='.repeat((4 - (padded.length % 4)) % 4));
    return JSON.parse(json);
  } catch {
    return null;
  }
}

/** Résolution depuis localStorage (persistence entre rechargements) */
function resolveByLocalStorage(storageKey: string): TenantId | undefined {
  if (typeof window === 'undefined') return undefined;
  try {
    const value = window.localStorage.getItem(storageKey);
    if (!value) return undefined;
    const tenant = getTenantById(value);
    return tenant?.id ?? value;
  } catch {
    return undefined;
  }
}

/** Résolution depuis une config statique (window.egenTenantId / env) */
function resolveByStatic(defaultTenantId?: string): TenantId | undefined {
  const fromWindow =
    typeof window !== 'undefined'
      ? ((window as unknown as Record<string, unknown>)['egenTenantId'] as string | undefined)
      : undefined;

  const fromEnv =
    typeof import.meta !== 'undefined'
      ? (import.meta as unknown as { env?: Record<string, string | undefined> }).env?.['VITE_TENANT_ID']
      : undefined;

  const value = defaultTenantId ?? fromWindow ?? fromEnv;
  if (!value) return undefined;
  const tenant = getTenantById(value);
  return tenant?.id ?? value;
}

/** Résolution par défaut : premier tenant actif disponible dans la registry */
function resolveByFirst(): TenantId | undefined {
  const tenants = getAllTenants();
  return tenants[0]?.id;
}

// ---------------------------------------------------------------------------
// Résolveur principal
// ---------------------------------------------------------------------------

const DEFAULT_RESOLUTION_ORDER: TenantResolutionStrategy[] = [
  'subdomain',
  'path',
  'query',
  'jwt',
  'header',
  'localStorage',
  'static',
  'first',
];

/**
 * Tente de résoudre le tenant actif en essayant les stratégies dans l'ordre
 * défini par la config. Retourne le premier TenantId trouvé.
 */
export function resolveActiveTenantId(config: TenantSystemConfig): TenantId | undefined {
  const order = config.resolutionOrder ?? DEFAULT_RESOLUTION_ORDER;
  const storageKey = config.storageKey ?? 'egen:tenant:active';

  for (const strategy of order) {
    let result: TenantId | undefined;

    switch (strategy) {
      case 'subdomain':
        result = resolveBySubdomain();
        break;
      case 'path':
        result = resolveByPath(config.pathConfig);
        break;
      case 'query':
        result = resolveByQuery();
        break;
      case 'jwt':
        result = resolveByJwt(config.jwtConfig);
        break;
      case 'header':
        result = resolveByHeader(storageKey);
        break;
      case 'localStorage':
        result = resolveByLocalStorage(storageKey);
        break;
      case 'static':
        result = resolveByStatic(config.defaultTenantId);
        break;
      case 'first':
        result = resolveByFirst();
        break;
    }

    if (result) {
      if (process.env.NODE_ENV !== 'production') {
        // eslint-disable-next-line no-console
        console.info(`[egen/esm-tenant] ✅ Tenant résolu via stratégie "${strategy}": "${result}"`);
      }
      return result;
    }
  }

  return undefined;
}

/**
 * Persiste le tenant actif en localStorage.
 * Appelé automatiquement après chaque activation si `persistActive: true`.
 */
export function persistActiveTenant(tenantId: TenantId, storageKey: string): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(storageKey, tenantId);
  } catch {
    // Quota dépassé, mode privé, etc. — non bloquant
  }
}

/**
 * Stocke la valeur du header X-Tenant-ID renvoyé par le backend.
 * À appeler dans l'intercepteur fetch/axios après chaque réponse authentifiée.
 */
export function storeHeaderTenantId(tenantId: TenantId, storageKey: string): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(`${storageKey}:header`, tenantId);
  } catch {
    // ignore
  }
}
