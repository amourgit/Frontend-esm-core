import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createDraftPersistence } from './core/draft';
import { memoryStorage } from './core/library';
import type { ThemeRuntimePort } from './core/runtime';
import { getStudioServices, resetStudioServices } from './services';

const config = { runtime: 'esm-theme' as const, applyPriority: 100, requiredPrivilege: '', storageKey: 'ts' };
const makeRuntime = (active: Record<string, unknown> | null = { priority: 1, meta: { name: 'Actif' }, borderRadius: { md: '4px' } }) => {
  let listener: ((m: 'light' | 'dark') => void) | undefined;
  const rt: ThemeRuntimePort & { emit(m: 'light' | 'dark'): void } = {
    id: 'esm-theme',
    previewVars: () => ({}),
    apply: vi.fn(),
    revert: vi.fn(),
    isApplied: () => false,
    getActiveTheme: () => active,
    getMode: () => 'dark',
    setMode: vi.fn(),
    subscribeMode: (l) => ((listener = l), () => undefined),
    emit: (m) => listener?.(m),
  };
  return rt;
};

describe('services du Studio (état)', () => {
  beforeEach(() => resetStudioServices());

  it('démarre sur le thème actif de l’environnement, dans son mode', () => {
    const b = getStudioServices(config, { runtime: makeRuntime(), storage: memoryStorage() });
    expect(b.startedFrom).toBe('active');
    expect(b.store.getState()).toMatchObject({ name: 'Actif', mode: 'dark' });
  });

  it('démarre vide (et le signale) si le moteur n’a pas de thème actif', () => {
    const b = getStudioServices(config, { runtime: makeRuntime(null), storage: memoryStorage() });
    expect(b.startedFrom).toBe('empty');
  });

  it('retrouve le même store en revenant sur l’app (changement de route du shell)', () => {
    const deps = { runtime: makeRuntime(), storage: memoryStorage() };
    const a = getStudioServices(config, deps);
    expect(getStudioServices(config, deps)).toBe(a);
  });

  it('reprend un brouillon enregistré, encore « modifié » par rapport au thème actif', () => {
    const storage = memoryStorage();
    createDraftPersistence(storage, 'ts').saveDraft({ priority: 1, meta: { name: 'Mon brouillon' }, borderRadius: { md: '20px' } }, 'Mon brouillon');
    createDraftPersistence(storage, 'ts').savePrefs({ level: 'advanced' });
    const b = getStudioServices(config, { runtime: makeRuntime(), storage });
    expect(b.startedFrom).toBe('draft');
    expect(b.store.isDirty()).toBe(true);
    expect(b.store.getState().level).toBe('advanced');
  });

  it('le mode d’édition suit le mode de l’application', () => {
    const rt = makeRuntime();
    const b = getStudioServices(config, { runtime: rt, storage: memoryStorage() });
    rt.emit('light');
    expect(b.store.getState().mode).toBe('light');
  });
});
