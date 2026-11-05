import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@egen-civitas/esm-framework', () => {
  const stores = new Map<string, { state: unknown; getState: () => unknown; setState: (u: unknown) => void }>();
  return {
    useStore: () => ({}),
    getGlobalStore: (name: string, initial: unknown) => {
      if (!stores.has(name)) {
        const store = {
          state: initial,
          getState: () => store.state,
          setState: (u: unknown) => {
            store.state = typeof u === 'function' ? (u as (s: unknown) => unknown)(store.state) : u;
          },
        };
        stores.set(name, store);
      }
      return stores.get(name);
    },
  };
});

import {
  closeTopBarLevel,
  getTopBarTransientStore,
  openTopBarLevel,
  removeTopBarLevel,
  resolveExpiry,
} from './transient-store';

const levels = () => getTopBarTransientStore().getState().levels;

describe('resolveExpiry', () => {
  it('illimitée par défaut, et pour une valeur invalide ou ≤ 0', () => {
    expect(resolveExpiry(1000)).toBeNull();
    expect(resolveExpiry(1000, 0)).toBeNull();
    expect(resolveExpiry(1000, Number.NaN, 'pas une date')).toBeNull();
  });

  it('ttl : depuis l’ouverture ; expiresAt : date précise ; la plus proche gagne', () => {
    expect(resolveExpiry(1000, 500)).toBe(1500);
    expect(resolveExpiry(1000, undefined, new Date(4000))).toBe(4000);
    expect(resolveExpiry(1000, 5000, 3000)).toBe(3000);
    expect(resolveExpiry(1000, 500, 3000)).toBe(1500);
  });
});

describe('niveaux éphémères (store)', () => {
  beforeEach(() => getTopBarTransientStore().setState({ levels: [] }));

  it('s’empilent dans l’ordre d’ouverture ; rouvrir le même id met à jour sans changer de place', () => {
    openTopBarLevel({ id: 'a', extension: 'x' });
    openTopBarLevel({ id: 'b', extension: 'y' });
    openTopBarLevel({ id: 'a', extension: 'x2' });
    expect(levels().map((l) => [l.id, l.extension])).toEqual([['a', 'x2'], ['b', 'y']]);
  });

  it('refuse d’ouvrir une échéance déjà passée', () => {
    expect(openTopBarLevel({ extension: 'x', expiresAt: Date.now() - 1000 })).toBeNull();
    expect(levels()).toHaveLength(0);
  });

  it('close marque la sortie animée ; remove retire définitivement', () => {
    openTopBarLevel({ id: 'a', extension: 'x', ttl: 60_000 });
    closeTopBarLevel('a');
    expect(levels()[0].closing).toBe(true);
    removeTopBarLevel('a');
    expect(levels()).toHaveLength(0);
  });
});
