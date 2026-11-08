import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getConfig, getSessionStore, navigate } from '@egen-civitas/esm-framework';
import { createRootRedirect } from './root-redirect';

interface FakeState {
  loaded: boolean;
  session: { authenticated: boolean } | null;
}

function fakeSessionStore(initial: FakeState) {
  let state = initial;
  const listeners = new Set<() => void>();
  return {
    getState: () => state,
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    set(next: FakeState) {
      state = next;
      listeners.forEach((l) => l());
    },
    listenerCount: () => listeners.size,
  };
}

async function mountRedirect(moduleName = '@egen-civitas/esm-user-profile-app') {
  const lifecycles = (await (createRootRedirect(moduleName) as unknown as (props: object) => Promise<{
    mount: (props: object) => Promise<void>;
    unmount: (props: object) => Promise<void>;
  }>)({})) as { mount: (props: object) => Promise<void>; unmount: (props: object) => Promise<void> };
  await lifecycles.mount({});
  return lifecycles;
}

describe('rootRedirect', () => {
  beforeEach(() => {
    Object.assign(window, { getEgenBase: () => '/', getEgenSpaBase: () => '/spa/' });
    vi.mocked(getConfig).mockResolvedValue({ session: { homeRoute: '${egenSpaBase}/home' } });
  });

  it("envoie l'utilisateur authentifié vers l'accueil dès le montage", async () => {
    vi.mocked(getSessionStore).mockReturnValue(fakeSessionStore({ loaded: true, session: { authenticated: true } }) as never);
    await mountRedirect();

    expect(navigate).toHaveBeenCalledTimes(1);
    expect(navigate).toHaveBeenCalledWith({ to: '/spa/home' });
  });

  it("ne fait STRICTEMENT rien tant que la session n'est pas authentifiée (le garde décide seul du renvoi)", async () => {
    const store = fakeSessionStore({ loaded: true, session: { authenticated: false } });
    vi.mocked(getSessionStore).mockReturnValue(store as never);
    await mountRedirect();

    expect(navigate).not.toHaveBeenCalled();
  });

  it("n'agit pas avant que la session soit chargée", async () => {
    vi.mocked(getSessionStore).mockReturnValue(fakeSessionStore({ loaded: false, session: { authenticated: true } }) as never);
    await mountRedirect();

    expect(navigate).not.toHaveBeenCalled();
  });

  it("redirige une seule fois quand la session devient authentifiée après le montage, puis se désabonne", async () => {
    const store = fakeSessionStore({ loaded: false, session: null });
    vi.mocked(getSessionStore).mockReturnValue(store as never);
    await mountRedirect();
    expect(store.listenerCount()).toBe(1);

    store.set({ loaded: true, session: { authenticated: true } });
    store.set({ loaded: true, session: { authenticated: true } });

    expect(navigate).toHaveBeenCalledTimes(1);
    expect(store.listenerCount()).toBe(0);
  });

  it('se désabonne au démontage', async () => {
    const store = fakeSessionStore({ loaded: false, session: null });
    vi.mocked(getSessionStore).mockReturnValue(store as never);
    const lifecycles = await mountRedirect();

    await lifecycles.unmount({});
    store.set({ loaded: true, session: { authenticated: true } });

    expect(store.listenerCount()).toBe(0);
    expect(navigate).not.toHaveBeenCalled();
  });

  it("la destination est celle de la configuration, avec repli sur l'accueil par défaut", async () => {
    vi.mocked(getSessionStore).mockReturnValue(fakeSessionStore({ loaded: true, session: { authenticated: true } }) as never);
    vi.mocked(getConfig).mockResolvedValue({ session: { homeRoute: '${egenSpaBase}/tableau-de-bord' } });
    await mountRedirect();
    expect(navigate).toHaveBeenLastCalledWith({ to: '/spa/tableau-de-bord' });

    vi.mocked(getConfig).mockRejectedValue(new Error('config indisponible'));
    await mountRedirect();
    expect(navigate).toHaveBeenLastCalledWith({ to: '/spa/home' });
  });
});
