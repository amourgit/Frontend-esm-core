// ============================================================================
//  Tests — Orchestrateur setupTenantSystem
// ============================================================================

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setupTenantSystem, switchTenant } from '../setup';
import { resetTenantRegistry } from '../context/registry';
import { resetTenantStore, getTenantStoreState } from '../context/store';

beforeEach(() => {
  resetTenantRegistry();
  resetTenantStore();
  localStorage.clear();
});

describe('setupTenantSystem — mode "off"', () => {
  it('ne charge rien et laisse le status à "idle"', async () => {
    await setupTenantSystem({ mode: 'off' });
    const state = getTenantStoreState();
    expect(state.mode).toBe('off');
    expect(state.activeTenant).toBeNull();
    expect(state.status).toBe('idle');
  });
});

describe('setupTenantSystem — mode "single"', () => {
  it('active le tenant défini', async () => {
    await setupTenantSystem({
      mode: 'single',
      staticTenants: [{ id: 'civitas', name: 'CIVITAS' }],
      defaultTenantId: 'civitas',
      applyTheme: false,
    });
    const state = getTenantStoreState();
    expect(state.activeTenant?.id).toBe('civitas');
    expect(state.status).toBe('active');
  });

  it('active le premier tenant si defaultTenantId absent', async () => {
    await setupTenantSystem({
      mode: 'single',
      staticTenants: [{ id: 'first-tenant', name: 'First' }],
      applyTheme: false,
    });
    expect(getTenantStoreState().activeTenant?.id).toBe('first-tenant');
  });
});

describe('setupTenantSystem — mode "multi"', () => {
  it('résout via stratégie "static"', async () => {
    await setupTenantSystem({
      mode: 'multi',
      staticTenants: [
        { id: 'acme', name: 'ACME' },
        { id: 'civitas', name: 'CIVITAS' },
      ],
      defaultTenantId: 'acme',
      resolutionOrder: ['static'],
      applyTheme: false,
    });
    expect(getTenantStoreState().activeTenant?.id).toBe('acme');
  });

  it('fallback sur le premier tenant si aucune stratégie ne résout', async () => {
    await setupTenantSystem({
      mode: 'multi',
      staticTenants: [{ id: 'only-tenant', name: 'Only' }],
      resolutionOrder: ['query'], // query retournera undefined
      applyTheme: false,
    });
    expect(getTenantStoreState().activeTenant?.id).toBe('only-tenant');
  });

  it('échoue proprement si la registry est vide', async () => {
    await setupTenantSystem({
      mode: 'multi',
      staticTenants: [],
      applyTheme: false,
    });
    expect(getTenantStoreState().status).toBe('error');
    expect(getTenantStoreState().error).toBeTruthy();
  });
});

describe('setupTenantSystem — tenant suspendu', () => {
  it('passe en status "suspended"', async () => {
    await setupTenantSystem({
      mode: 'single',
      staticTenants: [{ id: 'suspended', name: 'Suspended', suspended: true, suspendedMessage: 'Maintenance' }],
      defaultTenantId: 'suspended',
      applyTheme: false,
    });
    expect(getTenantStoreState().status).toBe('suspended');
    expect(getTenantStoreState().error).toBe('Maintenance');
  });
});

describe('switchTenant', () => {
  it('change le tenant actif', async () => {
    await setupTenantSystem({
      mode: 'multi',
      staticTenants: [
        { id: 'a', name: 'Tenant A' },
        { id: 'b', name: 'Tenant B' },
      ],
      defaultTenantId: 'a',
      resolutionOrder: ['static'],
      applyTheme: false,
    });
    expect(getTenantStoreState().activeTenant?.id).toBe('a');

    await switchTenant('b');
    expect(getTenantStoreState().activeTenant?.id).toBe('b');
  });

  it('ignore en mode "off"', async () => {
    await setupTenantSystem({ mode: 'off' });
    await switchTenant('b'); // doit juste warn, pas planter
    expect(getTenantStoreState().activeTenant).toBeNull();
  });
});
