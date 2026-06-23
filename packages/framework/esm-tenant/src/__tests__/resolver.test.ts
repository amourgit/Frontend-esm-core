// ============================================================================
//  Tests — Stratégies de résolution du tenant
// ============================================================================

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { resolveActiveTenantId, persistActiveTenant } from '../context/resolver';
import { initTenantRegistry, resetTenantRegistry } from '../context/registry';
import type { TenantSystemConfig } from '../types';

const BASE_CONFIG: TenantSystemConfig = {
  mode: 'multi',
  storageKey: 'eigen:tenant:active',
  persistActive: true,
  applyTheme: false,
};

beforeEach(async () => {
  resetTenantRegistry();
  await initTenantRegistry([
    { id: 'acme', name: 'ACME', slug: 'acme', domains: ['acme.app.com'] },
    { id: 'civitas', name: 'CIVITAS', active: true },
  ]);
  // Reset localStorage
  localStorage.clear();
});

describe('résolution par query param', () => {
  it('résout depuis ?tenant=acme', () => {
    Object.defineProperty(window, 'location', {
      value: { hostname: 'app.com', pathname: '/', search: '?tenant=acme' },
      writable: true,
    });
    const id = resolveActiveTenantId({ ...BASE_CONFIG, resolutionOrder: ['query'] });
    expect(id).toBe('acme');
  });
});

describe('résolution par localStorage', () => {
  it('résout depuis localStorage', () => {
    localStorage.setItem('eigen:tenant:active', 'civitas');
    const id = resolveActiveTenantId({ ...BASE_CONFIG, resolutionOrder: ['localStorage'] });
    expect(id).toBe('civitas');
  });

  it('retourne undefined si clé absente', () => {
    const id = resolveActiveTenantId({ ...BASE_CONFIG, resolutionOrder: ['localStorage'] });
    expect(id).toBeUndefined();
  });
});

describe('résolution par static (config)', () => {
  it('résout depuis defaultTenantId', () => {
    const id = resolveActiveTenantId({
      ...BASE_CONFIG,
      resolutionOrder: ['static'],
      defaultTenantId: 'civitas',
    });
    expect(id).toBe('civitas');
  });
});

describe('résolution "first"', () => {
  it('retourne le premier tenant actif', () => {
    const id = resolveActiveTenantId({ ...BASE_CONFIG, resolutionOrder: ['first'] });
    expect(['acme', 'civitas']).toContain(id);
  });
});

describe('persistActiveTenant', () => {
  it('écrit en localStorage', () => {
    persistActiveTenant('acme', 'eigen:tenant:active');
    expect(localStorage.getItem('eigen:tenant:active')).toBe('acme');
  });
});
