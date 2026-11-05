/* eslint-disable testing-library/no-node-access, testing-library/no-container --
   Les niveaux éphémères n'ont pas de rôle ARIA propre exploitable : on vérifie leur présence par `data-transient`. */
import React from 'react';
import { act, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';

// Vrai petit store réactif (abonnement via useSyncExternalStore) : ce test vérifie le comportement dans le temps.
vi.mock('@egen-civitas/esm-framework', async () => {
  const { useSyncExternalStore } = await import('react');
  type Store = { state: any; listeners: Set<() => void>; getState: () => any; setState: (u: any) => void; subscribe: (l: () => void) => () => void };
  const stores = new Map<string, Store>();
  const getGlobalStore = (name: string, initial: unknown) => {
    if (!stores.has(name)) {
      const store: Store = {
        state: initial,
        listeners: new Set(),
        getState: () => store.state,
        setState: (u) => {
          store.state = typeof u === 'function' ? u(store.state) : u;
          store.listeners.forEach((l) => l());
        },
        subscribe: (l) => {
          store.listeners.add(l);
          return () => store.listeners.delete(l);
        },
      };
      stores.set(name, store);
    }
    return stores.get(name)!;
  };
  return {
    getGlobalStore,
    useStore: (store: Store) => useSyncExternalStore(store.subscribe, store.getState),
    ExtensionSlot: (props: { name: string; select?: (e: unknown[]) => Array<{ id: string }> }) => {
      const all = [{ id: 'flash', name: 'flash' }];
      const kept = props.select ? props.select(all) : all;
      return <div data-testid={props.name}>{kept.map((e) => e.id).join(',')}</div>;
    },
  };
});

import { TransientLevels } from './TransientLevels';
import { TopBarUiProvider, type TopBarUi } from './context';
import { closeTopBarLevel, getTopBarTransientStore, openTopBarLevel, type TopBarTransientLevel } from './transient-store';

const ui: TopBarUi = {
  activeMenu: null,
  isActivePanel: () => false,
  togglePanel: vi.fn(),
  hidePanel: () => () => {},
  closePanels: vi.fn(),
  searchOpen: false,
  setSearchOpen: vi.fn(),
  isMobile: false,
  isDesktop: true,
};

const NOW = Date.parse('2026-11-05T10:00:00Z');
const advance = (ms: number) => act(() => void vi.advanceTimersByTime(ms));
const storeLevels = () => getTopBarTransientStore().getState().levels;
const write = (entry: Partial<TopBarTransientLevel> & { id: string }) =>
  act(() =>
    getTopBarTransientStore().setState((s) => ({
      levels: [...s.levels, { extension: 'flash', openedAt: Date.now(), expiresAt: null, closing: false, ...entry }],
    })),
  );

const mount = (dateRules?: { requireOffset?: boolean; defaultOffset?: string }) =>
  render(
    <TopBarUiProvider value={ui}>
      <TransientLevels dateRules={dateRules} />
    </TopBarUiProvider>,
  );
const row = (c: HTMLElement, id: string) => c.querySelector(`[data-transient="${id}"]`);

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] });
  vi.setSystemTime(NOW);
  getTopBarTransientStore().setState({ levels: [] });
});
afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('<TransientLevels /> — niveaux programmés', () => {
  it('invisible et sans hauteur avant l’heure ; apparaît pile à l’heure dite', () => {
    const { container } = mount();
    write({ id: 'p', startsAt: NOW + 60_000 });
    expect(container).toBeEmptyDOMElement();
    advance(59_000);
    expect(container).toBeEmptyDOMElement();
    advance(1_000);
    expect(row(container, 'p')).toHaveTextContent('flash');
  });

  it('le ttl court à partir du début : affiché 10 s, puis sortie animée, puis retiré', () => {
    const { container } = mount();
    act(() => void openTopBarLevel({ id: 'p', extension: 'flash', startsAt: NOW + 60_000, ttl: 10_000 }));
    advance(60_000);
    expect(row(container, 'p')).toHaveAttribute('data-state', expect.stringMatching(/entering|open/));
    advance(9_999);
    expect(row(container, 'p')).not.toHaveAttribute('data-state', 'leaving');
    advance(1);
    expect(row(container, 'p')).toHaveAttribute('data-state', 'leaving');
    advance(600);
    expect(row(container, 'p')).toBeNull();
    expect(storeLevels()).toHaveLength(0);
  });

  it('plusieurs niveaux programmés : chacun à son heure, un seul minuteur à la fois sur le prochain début', () => {
    const { container } = mount();
    write({ id: 'tard', startsAt: NOW + 120_000 });
    write({ id: 'tot', startsAt: NOW + 30_000 });
    advance(30_000);
    expect(row(container, 'tot')).not.toBeNull();
    expect(row(container, 'tard')).toBeNull();
    advance(90_000);
    expect(row(container, 'tard')).not.toBeNull();
  });

  it('lit une date ISO avec décalage écrite directement dans le store (09:00+01:00 = 08:00Z)', () => {
    const { container } = mount();
    write({ id: 'iso', startsAt: '2026-11-05T11:30:00+01:00' }); // = 10:30Z, soit dans 30 min
    advance(29 * 60_000);
    expect(row(container, 'iso')).toBeNull();
    advance(60_000);
    expect(row(container, 'iso')).not.toBeNull();
  });

  it('réévalue au retour d’onglet (les minuteurs sont ralentis en arrière-plan)', () => {
    const { container } = mount();
    write({ id: 'p', startsAt: NOW + 60_000 });
    act(() => {
      vi.setSystemTime(NOW + 90_000); // l’horloge avance, aucun minuteur n’a tiré
      document.dispatchEvent(new Event('visibilitychange'));
    });
    expect(row(container, 'p')).not.toBeNull();
  });

  it('annulé (closing) avant son début : retiré sans jamais s’afficher', () => {
    const { container } = mount();
    act(() => void openTopBarLevel({ id: 'p', extension: 'flash', startsAt: NOW + 60_000 }));
    act(() => closeTopBarLevel('p'));
    expect(container).toBeEmptyDOMElement();
    expect(storeLevels()).toHaveLength(0);
  });

  it('fin déjà passée avant son affichage : retiré sans animation parasite', () => {
    const { container } = mount();
    write({ id: 'perime', expiresAt: NOW - 1_000 });
    expect(container).toBeEmptyDOMElement();
    expect(storeLevels()).toHaveLength(0);
  });
});

describe('<TransientLevels /> — validation des écritures directes', () => {
  it('retire une date sans décalage (exigé par défaut) avec un avertissement', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { container } = mount();
    write({ id: 'naif', startsAt: '2026-11-05T11:30:00' });
    expect(container).toBeEmptyDOMElement();
    expect(storeLevels()).toHaveLength(0);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('naif'));
  });

  it('la même date est acceptée quand `requireOffset` est désactivé (décalage par défaut appliqué)', () => {
    const { container } = mount({ requireOffset: false, defaultOffset: '+01:00' });
    write({ id: 'naif', startsAt: '2026-11-05T11:30:00' }); // = 10:30Z
    expect(storeLevels()).toHaveLength(1);
    advance(30 * 60_000);
    expect(row(container, 'naif')).not.toBeNull();
  });

  it('retire une fin antérieure au début, ou une date illisible', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    mount();
    write({ id: 'inverse', startsAt: NOW + 60_000, expiresAt: NOW + 30_000 });
    write({ id: 'illisible', expiresAt: 'bientôt' });
    expect(storeLevels()).toHaveLength(0);
  });

  it('un niveau immédiat classique (sans startsAt) s’affiche tout de suite et n’est pas affecté', () => {
    const { container } = mount();
    write({ id: 'now', expiresAt: NOW + 5_000 });
    expect(row(container, 'now')).not.toBeNull();
  });
});
