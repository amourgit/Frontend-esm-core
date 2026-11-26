import { afterEach, describe, expect, it, vi } from 'vitest';

afterEach(() => {
  resetToastDedupe();
  vi.useRealTimers();
});
import { availableCapabilities } from '@egen-civitas/esm-embed-host';
import { CAPABILITY_IDS } from '@egen-civitas/esm-embed-protocol';
import { createCoreProviders, createEventBridge, EGEN_EVENT, resetToastDedupe, TOAST_DEDUPE_MS, type CoreServices } from './providers';

function fakeCore(over: Partial<CoreServices> = {}): CoreServices {
  return {
    getLocale: () => 'fr',
    getTenantId: () => 'tenant-1',
    isFeatureEnabled: (n) => n === 'beta',
    notify: vi.fn(),
    confirm: vi.fn(async () => true),
    log: vi.fn(),
    listExtensions: vi.fn(() => [{ name: 'nav-x', moduleName: '@egen/esm-x-app', meta: { label: 'X' } }]),
    subscribeExtensions: vi.fn(() => () => undefined),
    registerAiTools: vi.fn(),
    unregisterAiTools: vi.fn(),
    ...over,
  };
}

describe('createCoreProviders (seulement ce dont le Core est la source)', () => {
  it('langue, tenant, configuration de l’app, drapeaux, notifications, dialogues', async () => {
    const core = fakeCore();
    const p = createCoreProviders(core, { config: { studioApi: 'https://api.exemple.org' } });
    expect(await p.locale!.get()).toBe('fr');
    expect(await p.tenant!.get()).toEqual({ id: 'tenant-1' });
    expect(await p.config!.get()).toEqual({ studioApi: 'https://api.exemple.org' });
    expect(await p.flags!.isEnabled('beta')).toBe(true);
    expect(await p.flags!.isEnabled('autre')).toBe(false);
    await p.notifications!.show({ kind: 'success', title: 'OK' }, { moduleName: 'm' });
    expect(core.notify).toHaveBeenCalledWith({ kind: 'success', title: 'OK', subtitle: undefined });
    await expect(p.dialogs!.confirm({ title: 't', message: 'm' }, { moduleName: 'm' })).resolves.toBe(true);
  });

  it('tenant absent : id null ; configuration absente : objet vide', async () => {
    const p = createCoreProviders(fakeCore({ getTenantId: () => undefined }));
    expect(await p.tenant!.get()).toEqual({ id: null });
    expect(await p.config!.get()).toEqual({});
  });

  it('extensions : liste et abonnement qui relivre la liste courante', () => {
    let notify: (() => void) | undefined;
    const core = fakeCore({ subscribeExtensions: vi.fn((_slot, cb) => ((notify = cb), () => undefined)) });
    const p = createCoreProviders(core);
    expect(p.extensions!.list('topbar-nav-slot')).toHaveLength(1);
    const got: unknown[] = [];
    p.extensions!.subscribe!('topbar-nav-slot', (l) => got.push(l.length));
    notify!();
    expect(got).toEqual([1]);
  });

  it('outils IA et télémétrie relayés avec le module émetteur', () => {
    const core = fakeCore();
    const p = createCoreProviders(core);
    const invoke = async () => 1;
    p.aiTools!.register('@a/b', [{ name: 't', description: 'd' }], invoke);
    expect(core.registerAiTools).toHaveBeenCalledWith('@a/b', [{ name: 't', description: 'd' }], invoke);
    p.aiTools!.unregister('@a/b', ['t']);
    expect(core.unregisterAiTools).toHaveBeenCalledWith('@a/b', ['t']);
    p.telemetry!.log('warn', 'msg', { a: 1 }, { moduleName: '@a/b' });
    expect(core.log).toHaveBeenCalledWith('warn', 'msg', { a: 1 }, '@a/b');
  });

  it('les 12 capacités du SDK sont servies, et seulement elles (aucune promesse non tenue, aucune capacité retirée)', () => {
    const avail = availableCapabilities(createCoreProviders(fakeCore()));
    expect([...avail].sort()).toEqual([...CAPABILITY_IDS].sort());
    expect(CAPABILITY_IDS).toHaveLength(12);
    const providers = createCoreProviders(fakeCore()) as Record<string, unknown>;
    for (const removed of ['session', 'permissions', 'theme', 'api']) expect(providers[removed]).toBeUndefined();
  });
});

describe('toasts : le Core est l’afficheur (attribution, dédoublonnage)', () => {
  const ctx = { moduleName: '@civitas/esm-studio-app' };

  it('attribue le toast à son app d’origine (anti-usurpation) sans écraser le sous-titre', async () => {
    const core = fakeCore();
    const p = createCoreProviders(core, { title: 'Theme Studio' });
    await p.notifications!.show({ kind: 'success', title: 'Enregistré' }, ctx);
    await p.notifications!.show({ kind: 'error', title: 'Échec', subtitle: 'Réseau indisponible' }, ctx);
    expect(core.notify).toHaveBeenNthCalledWith(1, { kind: 'success', title: 'Enregistré', subtitle: 'Theme Studio' });
    expect(core.notify).toHaveBeenNthCalledWith(2, { kind: 'error', title: 'Échec', subtitle: 'Theme Studio · Réseau indisponible' });
  });

  it('le même id n’est pas réaffiché dans la fenêtre de dédoublonnage ; l’app est informée (false)', async () => {
    vi.useFakeTimers();
    const core = fakeCore();
    const p = createCoreProviders(core, { title: 'Studio' });
    expect(await p.notifications!.show({ kind: 'info', title: 'a', id: 'saved' }, ctx)).toBe(true);
    expect(await p.notifications!.show({ kind: 'info', title: 'a', id: 'saved' }, ctx)).toBe(false);
    expect(core.notify).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(TOAST_DEDUPE_MS + 1);
    expect(await p.notifications!.show({ kind: 'info', title: 'a', id: 'saved' }, ctx)).toBe(true);
    expect(core.notify).toHaveBeenCalledTimes(2);
  });

  it('sans id : jamais dédoublonné ; l’id est propre à chaque app', async () => {
    const core = fakeCore();
    const p = createCoreProviders(core);
    await p.notifications!.show({ kind: 'info', title: 'x' }, ctx);
    await p.notifications!.show({ kind: 'info', title: 'x' }, ctx);
    expect(core.notify).toHaveBeenCalledTimes(2);
    await p.notifications!.show({ kind: 'info', title: 'y', id: 'same' }, ctx);
    expect(await p.notifications!.show({ kind: 'info', title: 'y', id: 'same' }, { moduleName: '@autre/app' })).toBe(true);
    expect(core.notify).toHaveBeenCalledTimes(4);
  });

  it('l’id n’est pas transmis à l’affichage du Core', async () => {
    const core = fakeCore();
    await createCoreProviders(core).notifications!.show({ kind: 'info', title: 'x', id: 'k' }, ctx);
    expect(JSON.stringify(vi.mocked(core.notify).mock.calls[0][0])).not.toContain('"id"');
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
