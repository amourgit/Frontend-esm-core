import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

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
  setTransientDateRules,
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

describe('niveaux éphémères programmés (startsAt)', () => {
  const NOW = Date.parse('2026-11-05T10:00:00Z');
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    getTopBarTransientStore().setState({ levels: [] });
    setTransientDateRules({ requireOffset: true, defaultOffset: '+01:00' });
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('enregistre un début futur en epoch ; le ttl court à partir de ce début', () => {
    openTopBarLevel({ id: 'p', extension: 'x', startsAt: '2026-11-06T09:00:00+01:00', ttl: 10_000 });
    const start = Date.parse('2026-11-06T08:00:00Z');
    expect(levels()[0]).toMatchObject({ id: 'p', startsAt: start, expiresAt: start + 10_000, closing: false });
  });

  it('sans début (ou début déjà passé) : startsAt vaut null, affichage immédiat', () => {
    openTopBarLevel({ id: 'a', extension: 'x', ttl: 10_000 });
    openTopBarLevel({ id: 'b', extension: 'x', startsAt: NOW - 60_000 });
    expect(levels().map((l) => l.startsAt)).toEqual([null, null]);
    expect(levels()[0].expiresAt).toBe(NOW + 10_000);
  });

  it('refuse une date sans décalage tant que requireOffset est actif, avec un avertissement', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(openTopBarLevel({ id: 'z', extension: 'x', startsAt: '2026-11-06T09:00:00' })).toBeNull();
    expect(levels()).toHaveLength(0);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('décalage horaire manquant'));
  });

  it('accepte une date sans décalage quand la config le permet (décalage par défaut appliqué)', () => {
    setTransientDateRules({ requireOffset: false, defaultOffset: '+01:00' });
    openTopBarLevel({ id: 'z', extension: 'x', startsAt: '2026-11-06T09:00:00' });
    expect(levels()[0].startsAt).toBe(Date.parse('2026-11-06T08:00:00Z'));
  });

  it('refuse une fin antérieure au début programmé, ou une date illisible', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(openTopBarLevel({ extension: 'x', startsAt: '2026-11-06T09:00:00+01:00', expiresAt: '2026-11-06T07:00:00Z' })).toBeNull();
    expect(openTopBarLevel({ extension: 'x', expiresAt: 'bientôt' })).toBeNull();
    expect(levels()).toHaveLength(0);
  });

  it('rouvrir un id programmé met à jour la programmation sans changer de place', () => {
    openTopBarLevel({ id: 'p', extension: 'x', startsAt: '2026-11-06T09:00:00+01:00' });
    openTopBarLevel({ id: 'q', extension: 'x' });
    openTopBarLevel({ id: 'p', extension: 'x', startsAt: '2026-11-07T09:00:00+01:00' });
    expect(levels().map((l) => l.id)).toEqual(['p', 'q']);
    expect(levels()[0].startsAt).toBe(Date.parse('2026-11-07T08:00:00Z'));
  });
});
