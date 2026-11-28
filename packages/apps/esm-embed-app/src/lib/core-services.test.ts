import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@egen-civitas/esm-framework', () => ({
  getAssignedExtensions: vi.fn(),
  getExtensionRegistration: vi.fn(),
  getExtensionStore: vi.fn(),
  getFeatureFlag: vi.fn(),
  getLocale: vi.fn(),
  getSessionStore: vi.fn(),
  getTenantId: vi.fn(),
  showSnackbar: vi.fn(),
  userHasAccess: vi.fn(),
}));

import * as fw from '@egen-civitas/esm-framework';
import { coreServices, listExtensions } from './core-services';

const m = <T>(f: unknown) => f as ReturnType<typeof vi.fn> & T;

const assigned = (id: string, over: Record<string, unknown> = {}) => ({
  id,
  name: id,
  moduleName: `@egen/${id}`,
  meta: { label: id },
  config: null,
  ...over,
});

let regs: Record<string, Record<string, unknown> | undefined>;
let user: unknown;

beforeEach(() => {
  regs = {};
  user = { uuid: 'u' };
  m(fw.getExtensionRegistration).mockImplementation((id: string) => regs[id]);
  m(fw.getSessionStore).mockImplementation(() => ({
    getState: () => (user ? { loaded: true, session: { user } } : { loaded: false }),
  }));
  m(fw.getFeatureFlag).mockReturnValue(true);
  m(fw.userHasAccess).mockReturnValue(true);
});

describe('listExtensions (le Core reste l’autorité d’affichage)', () => {
  it('ne retourne que les extensions enregistrées, visibles, avec des champs transmissibles', () => {
    m(fw.getAssignedExtensions).mockReturnValue([
      assigned('a'),
      assigned('ghost'),
      assigned('flagged'),
      assigned('priv'),
      assigned('open'),
    ]);
    regs = {
      a: { order: 2, privileges: undefined },
      flagged: { featureFlag: 'beta' },
      priv: { privileges: ['Voir X'] },
      open: { order: 1, privileges: [] },
    };
    m(fw.getFeatureFlag).mockImplementation((f: string) => f !== 'beta');
    m(fw.userHasAccess).mockReturnValue(false);
    const r = listExtensions('topbar-nav-slot');
    expect(r.map((e) => e.name)).toEqual(['a', 'open']);
    expect(r[0]).toEqual({ name: 'a', moduleName: '@egen/a', order: 2, meta: { label: 'a' } });
    expect(fw.userHasAccess).toHaveBeenCalledWith(['Voir X'], user);
  });

  it('privilèges requis et session non chargée : masquée ; autorisée si l’utilisateur a le privilège', () => {
    m(fw.getAssignedExtensions).mockReturnValue([assigned('priv')]);
    regs = { priv: { privileges: 'Voir X' } };
    user = null;
    expect(listExtensions('s')).toEqual([]);
    user = { uuid: 'u' };
    m(fw.userHasAccess).mockReturnValue(true);
    expect(listExtensions('s')).toHaveLength(1);
  });

  it('meta non transmissible : réduite à des données JSON', () => {
    m(fw.getAssignedExtensions).mockReturnValue([assigned('a', { meta: { label: 'A', fn: () => 1 } })]);
    regs = { a: {} };
    expect(listExtensions('s')[0].meta).toEqual({ label: 'A' });
    const cyc: Record<string, unknown> = {};
    cyc.self = cyc;
    m(fw.getAssignedExtensions).mockReturnValue([assigned('a', { meta: cyc })]);
    expect(listExtensions('s')[0].meta).toEqual({});
  });
});

describe('subscribeExtensions : notifie seulement si la liste visible change', () => {
  it('dédoublonne les mouvements du store', () => {
    let listener: () => void = () => undefined;
    const unsub = vi.fn();
    m(fw.getExtensionStore).mockReturnValue({ subscribe: (l: () => void) => ((listener = l), unsub) });
    regs = { a: {}, b: {} };
    m(fw.getAssignedExtensions).mockReturnValue([assigned('a')]);
    const cb = vi.fn();
    const off = coreServices.subscribeExtensions('s', cb);
    listener();
    expect(cb).not.toHaveBeenCalled();
    m(fw.getAssignedExtensions).mockReturnValue([assigned('a'), assigned('b')]);
    listener();
    expect(cb).toHaveBeenCalledTimes(1);
    listener();
    expect(cb).toHaveBeenCalledTimes(1);
    off();
    expect(unsub).toHaveBeenCalled();
  });
});

describe('services du Core', () => {
  it('notifications, langue, tenant, drapeaux', () => {
    m(fw.getLocale).mockReturnValue('en');
    m(fw.getTenantId).mockReturnValue('acme');
    coreServices.notify({ kind: 'warning', title: 'T', subtitle: 'S', timeoutMs: 3000 });
    expect(fw.showSnackbar).toHaveBeenCalledWith({ title: 'T', subtitle: 'S', kind: 'warning', timeoutInMs: 3000 });
    expect(coreServices.getLocale()).toBe('en');
    expect(coreServices.getTenantId()).toBe('acme');
    expect(coreServices.isFeatureEnabled('x')).toBe(true);
  });
});
