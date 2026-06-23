// ============================================================================
//  Tests — Registry des tenants
// ============================================================================

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  initTenantRegistry,
  getAllTenants,
  getTenantById,
  getTenantByDomain,
  registerTenant,
  resetTenantRegistry,
  isTenantRegistryLoaded,
} from '../context/registry';
import type { TenantDefinition } from '../types';

const TENANT_A: TenantDefinition = {
  id: 'tenant-a',
  name: 'Tenant A',
  slug: 'a',
  domains: ['tenant-a.example.com', 'a'],
  active: true,
};

const TENANT_B: TenantDefinition = {
  id: 'tenant-b',
  name: 'Tenant B',
  active: false,
};

beforeEach(() => {
  resetTenantRegistry();
});

describe('initTenantRegistry', () => {
  it('charge les tenants statiques', async () => {
    const tenants = await initTenantRegistry([TENANT_A, TENANT_B]);
    expect(tenants).toHaveLength(2);
    expect(isTenantRegistryLoaded()).toBe(true);
  });

  it('getAllTenants ne retourne que les actifs par défaut', async () => {
    await initTenantRegistry([TENANT_A, TENANT_B]);
    const active = getAllTenants();
    expect(active).toHaveLength(1);
    expect(active[0].id).toBe('tenant-a');
  });

  it('getAllTenants(true) retourne tous les tenants', async () => {
    await initTenantRegistry([TENANT_A, TENANT_B]);
    expect(getAllTenants(true)).toHaveLength(2);
  });

  it('les statiques écrasent les distants si même ID', async () => {
    // Simuler un fetch qui retourne un tenant distant
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [{ id: 'tenant-a', name: 'Tenant A distant', active: true }],
    } as Response);

    await initTenantRegistry([TENANT_A], 'https://example.com/registry.json');
    const found = getTenantById('tenant-a');
    // Le statique (nom "Tenant A") doit écraser le distant ("Tenant A distant")
    expect(found?.name).toBe('Tenant A');
  });
});

describe('getTenantById', () => {
  beforeEach(async () => {
    await initTenantRegistry([TENANT_A]);
  });

  it('trouve par ID exact', () => {
    expect(getTenantById('tenant-a')).toBeDefined();
  });

  it('trouve par slug', () => {
    expect(getTenantById('a')?.id).toBe('tenant-a');
  });

  it('retourne undefined si introuvable', () => {
    expect(getTenantById('unknown')).toBeUndefined();
  });
});

describe('getTenantByDomain', () => {
  beforeEach(async () => {
    await initTenantRegistry([TENANT_A]);
  });

  it('trouve par hostname exact', () => {
    expect(getTenantByDomain('tenant-a.example.com')?.id).toBe('tenant-a');
  });

  it('trouve par subdomain si ID correspond', () => {
    // 'tenant-a'.split('.')[0] = 'tenant-a' → match sur l'ID
    expect(getTenantByDomain('tenant-a.app.com')?.id).toBe('tenant-a');
  });
});

describe('registerTenant', () => {
  it('ajoute un tenant dynamiquement', async () => {
    await initTenantRegistry([]);
    registerTenant({ id: 'new', name: 'New Tenant' });
    expect(getTenantById('new')?.name).toBe('New Tenant');
  });
});
