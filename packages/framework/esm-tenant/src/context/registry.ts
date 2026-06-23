// ============================================================================
//  @egen/esm-tenant — Registry des tenants
// ============================================================================
//
//  La registry est la source de vérité des tenants disponibles.
//  Elle fusionne :
//    1. Les tenants définis statiquement dans la config (`staticTenants`)
//    2. Les tenants chargés depuis un fichier JSON distant (`registryUrl`)
//
//  En cas de conflit d'ID, le tenant statique est prioritaire sur le distant.
// ============================================================================

import type { TenantDefinition, TenantId } from '../types';

let _registry: Map<TenantId, TenantDefinition> = new Map();
let _loaded = false;

/**
 * Charge la registry depuis une URL distante.
 * Retourne un tableau vide si la requête échoue (non bloquant).
 */
async function loadRemoteRegistry(url: string): Promise<TenantDefinition[]> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.warn(`[egen/esm-tenant] Registry distante inaccessible (${response.status}) : ${url}`);
      return [];
    }
    const data = await response.json();
    if (!Array.isArray(data)) {
      console.warn('[egen/esm-tenant] La registry distante doit être un tableau JSON (TenantDefinition[])');
      return [];
    }
    return data as TenantDefinition[];
  } catch (err) {
    console.warn('[egen/esm-tenant] Erreur lors du chargement de la registry distante:', err);
    return [];
  }
}

/**
 * Initialise la registry de tenants.
 * Fusionne les tenants statiques et distants. Les statiques prennent la priorité.
 */
export async function initTenantRegistry(
  staticTenants: TenantDefinition[] = [],
  registryUrl?: string,
): Promise<TenantDefinition[]> {
  const remote = registryUrl ? await loadRemoteRegistry(registryUrl) : [];

  // Construire la map en commençant par les distants, puis écraser avec les statiques
  const map = new Map<TenantId, TenantDefinition>();
  for (const tenant of remote) {
    map.set(tenant.id, { active: true, ...tenant });
  }
  for (const tenant of staticTenants) {
    map.set(tenant.id, { active: true, ...tenant });
  }

  _registry = map;
  _loaded = true;

  if (process.env.NODE_ENV !== 'production') {
    // eslint-disable-next-line no-console
    console.info(`[egen/esm-tenant] Registry initialisée avec ${map.size} tenant(s):`, [...map.keys()]);
  }

  return [...map.values()];
}

/** Retourne tous les tenants disponibles (actifs uniquement par défaut) */
export function getAllTenants(includeInactive = false): TenantDefinition[] {
  const tenants = [..._registry.values()];
  return includeInactive ? tenants : tenants.filter((t) => t.active !== false);
}

/** Retourne un tenant par son ID ou son slug */
export function getTenantById(id: TenantId): TenantDefinition | undefined {
  // Chercher par ID exact
  if (_registry.has(id)) return _registry.get(id);
  // Chercher par slug
  for (const tenant of _registry.values()) {
    if (tenant.slug === id) return tenant;
  }
  return undefined;
}

/** Retourne un tenant à partir d'un hostname (stratégie subdomain) */
export function getTenantByDomain(hostname: string): TenantDefinition | undefined {
  const subdomain = hostname.split('.')[0];
  for (const tenant of _registry.values()) {
    if (tenant.domains?.some((d) => d === hostname || d === subdomain)) {
      return tenant;
    }
    // Fallback: l'ID ou le slug correspond au subdomain
    if (tenant.id === subdomain || tenant.slug === subdomain) {
      return tenant;
    }
  }
  return undefined;
}

/** Retourne true si la registry a été initialisée */
export function isTenantRegistryLoaded(): boolean {
  return _loaded;
}

/** Ajoute ou met à jour un tenant dans la registry (runtime) */
export function registerTenant(tenant: TenantDefinition): void {
  _registry.set(tenant.id, { active: true, ...tenant });
}

/** Réinitialise la registry (utile pour les tests) */
export function resetTenantRegistry(): void {
  _registry = new Map();
  _loaded = false;
}
