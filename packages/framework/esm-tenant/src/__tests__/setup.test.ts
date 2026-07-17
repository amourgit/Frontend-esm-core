// ============================================================================
//  Tests — Orchestrateur setupTenantSystem
// ============================================================================

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setupTenantSystem, switchTenant, reloadTenantRegistry } from '../setup';
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
  it('passe en status "suspended" ET peuple activeTenant avec ses métadonnées', async () => {
    await setupTenantSystem({
      mode: 'single',
      staticTenants: [{ id: 'suspended', name: 'Suspended', suspended: true, suspendedMessage: 'Maintenance' }],
      defaultTenantId: 'suspended',
      applyTheme: false,
    });
    const state = getTenantStoreState();
    expect(state.status).toBe('suspended');
    // activeTenant DOIT être peuplé — c'est ce qui permet à useTenant(),
    // useTenantIsSuspended() et à la page /tenant-suspended de connaître le
    // tenant concerné et d'afficher son message personnalisé. Une régression
    // ici (activeTenant qui redevient null) casse silencieusement l'écran de
    // suspension dans esm-tenant-routing-app sans qu'aucun test ne le
    // détecte ailleurs — ne pas retirer cette assertion.
    expect(state.activeTenant?.id).toBe('suspended');
    expect(state.activeTenant?.suspended).toBe(true);
    expect(state.activeTenant?.suspendedMessage).toBe('Maintenance');
    // Le message vit sur activeTenant.suspendedMessage, pas dans `error`
    // (réservé aux erreurs système réelles : registry vide, fetch échoué…).
    expect(state.error).toBeNull();
  });

  it('ne persiste pas un tenant suspendu comme dernier tenant actif', async () => {
    await setupTenantSystem({
      mode: 'single',
      staticTenants: [{ id: 'suspended', name: 'Suspended', suspended: true }],
      defaultTenantId: 'suspended',
      applyTheme: false,
      persistActive: true,
      storageKey: 'egen:tenant:test-suspended',
    });
    expect(localStorage.getItem('egen:tenant:test-suspended')).toBeNull();
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

describe('reloadTenantRegistry', () => {
  it('vide activeTenant si le tenant actif a disparu de la registry rechargée', async () => {
    const staticTenants = [
      { id: 'a', name: 'Tenant A' },
      { id: 'b', name: 'Tenant B' },
    ];
    await setupTenantSystem({
      mode: 'multi',
      staticTenants,
      defaultTenantId: 'a',
      resolutionOrder: ['static'],
      applyTheme: false,
    });
    expect(getTenantStoreState().activeTenant?.id).toBe('a');

    // Simule la suppression du tenant "a" côté registry (même référence
    // d'array que celle capturée dans la config au setup).
    staticTenants.splice(0, 1);
    await reloadTenantRegistry();

    const state = getTenantStoreState();
    expect(state.activeTenant).toBeNull();
    expect(state.status).toBe('error');
  });

  it('réactive normalement le tenant actif toujours présent', async () => {
    const staticTenants = [{ id: 'a', name: 'Tenant A' }];
    await setupTenantSystem({
      mode: 'multi',
      staticTenants,
      defaultTenantId: 'a',
      resolutionOrder: ['static'],
      applyTheme: false,
    });
    await reloadTenantRegistry();
    expect(getTenantStoreState().activeTenant?.id).toBe('a');
    expect(getTenantStoreState().status).toBe('active');
  });
});
