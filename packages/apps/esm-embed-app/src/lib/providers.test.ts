import { describe, expect, it, vi } from 'vitest';
import { availableCapabilities } from '@egen-civitas/esm-embed-host';
import { createCoreProviders, createEventBridge, EGEN_EVENT, type CoreServices } from './providers';

function fakeCore(over: Partial<CoreServices> = {}): CoreServices & { sessionCbs: Array<(s: any) => void> } {
  const sessionCbs: Array<(s: any) => void> = [];
  return {
    sessionCbs,
    getSession: () => ({ authenticated: true, user: { display: 'Sam' }, sessionId: 'SECRET' }),
    subscribeSession: (cb) => (sessionCbs.push(cb), () => void sessionCbs.splice(sessionCbs.indexOf(cb), 1)),
    getLocale: () => 'fr',
    getTenantId: () => 'tenant-1',
    isFeatureEnabled: (n) => n === 'beta',
    userHasAccess: (p) => p === 'admin',
    notify: vi.fn(),
    log: vi.fn(),
    ...over,
  };
}

describe('createCoreProviders', () => {
  it('sert session, langue, tenant, drapeaux, permissions, notifications', async () => {
    const core = fakeCore();
    const p = createCoreProviders(core);
    expect(await p.session!.get()).toMatchObject({ authenticated: true });
    expect(await p.locale!.get()).toBe('fr');
    expect(await p.tenant!.get()).toEqual({ id: 'tenant-1' });
    expect(await p.flags!.isEnabled('beta')).toBe(true);
    expect(await p.flags!.isEnabled('autre')).toBe(false);
    expect(await p.permissions!.can('admin')).toBe(true);
    await p.notifications!.show({ kind: 'success', title: 'OK' }, { moduleName: 'm' });
    expect(core.notify).toHaveBeenCalledWith({ kind: 'success', title: 'OK' });
  });

  it('session non chargée : undefined ; changements relayés', async () => {
    const core = fakeCore({ getSession: () => null, getTenantId: () => undefined });
    const p = createCoreProviders(core);
    expect(await p.session!.get()).toBeUndefined();
    expect(await p.tenant!.get()).toEqual({ id: null });
    const got: unknown[] = [];
    const off = p.session!.subscribe!((s) => got.push(s));
    core.sessionCbs[0]({ authenticated: true });
    core.sessionCbs[0](null);
    expect(got).toEqual([{ authenticated: true }, undefined]);
    off();
    expect(core.sessionCbs).toHaveLength(0);
  });

  it('télémétrie : journalise avec le module émetteur', () => {
    const core = fakeCore();
    createCoreProviders(core).telemetry!.log('warn', 'msg', { a: 1 }, { moduleName: '@a/b' });
    expect(core.log).toHaveBeenCalledWith('warn', 'msg', { a: 1 }, '@a/b');
  });

  it('capacités annoncées : celles servies, et seulement celles-là (pas de promesse non tenue)', () => {
    const avail = availableCapabilities(createCoreProviders(fakeCore()));
    for (const served of ['session', 'locale', 'tenant', 'flags', 'permissions', 'events', 'notifications', 'telemetry', 'navigation', 'lifecycle']) expect(avail.has(served as any)).toBe(true);
    for (const missing of ['theme', 'api', 'dialogs', 'ai-tools', 'config']) expect(avail.has(missing as any)).toBe(false);
  });
});

describe('bus d’événements (CustomEvent egen:event)', () => {
  it('publier → un abonné du même sujet reçoit la charge ; autres sujets ignorés', () => {
    const bus = createEventBridge(window);
    const got: unknown[] = [];
    const off = bus.subscribe('app.x.saved', (p) => got.push(p));
    bus.publish('app.x.saved', { id: 1 }, { moduleName: '@a/b' });
    bus.publish('app.x.autre', { id: 2 }, { moduleName: '@a/b' });
    expect(got).toEqual([{ id: 1 }]);
    off();
    bus.publish('app.x.saved', { id: 3 }, { moduleName: '@a/b' });
    expect(got).toEqual([{ id: 1 }]);
  });
  it('le Core (ou une app interne) publie par un simple CustomEvent', () => {
    const bus = createEventBridge(window);
    const got: unknown[] = [];
    bus.subscribe('core.theme.changed', (p) => got.push(p));
    window.dispatchEvent(new CustomEvent(EGEN_EVENT, { detail: { topic: 'core.theme.changed', payload: 'dark' } }));
    window.dispatchEvent(new CustomEvent(EGEN_EVENT, { detail: null }));
    expect(got).toEqual(['dark']);
  });
});
