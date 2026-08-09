// ============================================================================
//  @egen/esm-tenant — Stratégies de capture du tenant actif
// ============================================================================
//
//  Chaque stratégie tente d'extraire un TenantId BRUT depuis une source.
//  Retourne undefined si la source est absente ou vide. AUCUNE stratégie
//  ne vérifie la valeur trouvée contre une liste de tenants "connus" — ce
//  concept n'existe plus côté frontend (voir types.ts). On capture, un
//  point c'est tout ; la validité du tenant est une question backend.
//
//  ORDRE PAR DÉFAUT (du plus déterministe au plus générique) :
//  1. subdomain  — le plus déterministe, sans ambiguïté
//  2. path       — clair mais nécessite une config de routing côté app
//  3. query      — utile pour le dev / preview
//  4. jwt        — lecture du claim dans le token de session
//  5. header     — reprend en localStorage le tenant déjà connu côté
//                   client au moment du login (ne lit PAS un header HTTP
//                   réel — voir TenantResolutionStrategy dans types.ts)
//  6. localStorage — survie aux rechargements
//  7. static     — config globale window / env
// ============================================================================

import type { TenantId, TenantResolutionStrategy, TenantSystemConfig } from '../types';
import { isLocalhostOrIp, inferRootDomain, extractSubdomain } from '../utils/domain-utils';

// ---------------------------------------------------------------------------
// Stratégies individuelles
// ---------------------------------------------------------------------------

/** Capture par subdomain de window.location.hostname, par rapport à un rootDomain. */
function resolveBySubdomain(rootDomain?: string): TenantId | undefined {
  if (typeof window === 'undefined') return undefined;
  const hostname = window.location.hostname;
  if (isLocalhostOrIp(hostname)) return undefined;

  const effectiveRoot = inferRootDomain(hostname, rootDomain);
  const subdomain = extractSubdomain(hostname, effectiveRoot);
  return subdomain ?? undefined;
}

/** Capture par segment de path URL */
function resolveByPath(config?: TenantSystemConfig['pathConfig']): TenantId | undefined {
  if (typeof window === 'undefined') return undefined;
  const prefix = config?.prefix ?? '/t/';
  const pathname = window.location.pathname;

  if (prefix && pathname.startsWith(prefix)) {
    const rest = pathname.slice(prefix.length);
    const slug = rest.split('/')[0];
    if (slug) return slug;
  }

  // Stratégie segment (sans préfixe)
  const segment = config?.segment ?? 0;
  const parts = pathname.split('/').filter(Boolean);
  const slug = parts[segment];
  return slug || undefined;
}

/** Capture par query param ?tenant= */
function resolveByQuery(): TenantId | undefined {
  if (typeof window === 'undefined') return undefined;
  const params = new URLSearchParams(window.location.search);
  const value = params.get('tenant') ?? params.get('tenantId') ?? params.get('tid');
  return value || undefined;
}

/** Capture depuis la valeur reportée en localStorage lors du login (voir storeHeaderTenantId) */
function resolveByHeader(storageKey: string): TenantId | undefined {
  if (typeof window === 'undefined') return undefined;
  try {
    const value = window.localStorage.getItem(`${storageKey}:header`);
    return value || undefined;
  } catch {
    return undefined;
  }
}

/**
 * Capture depuis un claim JWT.
 * Le JWT est lu depuis le localStorage/sessionStorage (clé : "egen:session:token").
 * On ne fait QUE lire le payload — aucune vérification de signature côté frontend
 * (c'est le rôle du backend, à chaque requête authentifiée).
 */
function resolveByJwt(jwtConfig?: TenantSystemConfig['jwtConfig']): TenantId | undefined {
  const claim = jwtConfig?.claim ?? 'tenantId';
  const token = readTokenFromStorage();
  if (!token) return undefined;

  try {
    const payload = parseJwtPayload(token);
    const value = payload?.[claim] ?? payload?.['tid'] ?? payload?.['tenant_id'];
    return value ? String(value) : undefined;
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

/** Capture depuis localStorage (persistence entre rechargements) */
function resolveByLocalStorage(storageKey: string): TenantId | undefined {
  if (typeof window === 'undefined') return undefined;
  try {
    const value = window.localStorage.getItem(storageKey);
    return value || undefined;
  } catch {
    return undefined;
  }
}

/** Capture depuis une config statique (window.egenTenantId, voir config/env.ts) */
function resolveByStatic(defaultTenantId?: string): TenantId | undefined {
  const fromWindow =
    typeof window !== 'undefined'
      ? ((window as unknown as Record<string, unknown>)['egenTenantId'] as string | undefined)
      : undefined;

  return defaultTenantId ?? fromWindow ?? undefined;
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
];

/**
 * Tente de capturer le tenant actif en essayant les stratégies dans l'ordre
 * défini par la config. Retourne le premier couple (TenantId, stratégie)
 * trouvé, brut, sans aucune vérification de validité.
 */
export function resolveActiveTenantId(
  config: TenantSystemConfig,
): { tenantId: TenantId; source: TenantResolutionStrategy } | undefined {
  const order = config.resolutionOrder ?? DEFAULT_RESOLUTION_ORDER;
  const storageKey = config.storageKey ?? 'egen:tenant:active';

  for (const strategy of order) {
    let result: TenantId | undefined;

    switch (strategy) {
      case 'subdomain':
        result = resolveBySubdomain(config.rootDomain);
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
    }

    if (result) {
      if (process.env.NODE_ENV !== 'production') {
        // eslint-disable-next-line no-console
        console.info(`[egen/esm-tenant] ✅ Tenant capturé via stratégie "${strategy}": "${result}"`);
      }
      return { tenantId: result, source: strategy };
    }
  }

  return undefined;
}

/**
 * Persiste le tenant actif en localStorage.
 * Appelé automatiquement après chaque capture si `persistActive: true`.
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
 * Efface le tenant persisté en localStorage (ex: lors d'un switchTenant vers `null`).
 */
export function clearPersistedTenant(storageKey: string): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(storageKey);
  } catch {
    // ignore
  }
}

/**
 * Stocke la valeur du tenant déjà connu côté client au moment du login,
 * pour qu'elle soit relue par la stratégie "header" aux prochains chargements.
 * À appeler dans le flux de login juste après une authentification réussie.
 */
export function storeHeaderTenantId(tenantId: TenantId, storageKey: string): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(`${storageKey}:header`, tenantId);
  } catch {
    // ignore
  }
}
