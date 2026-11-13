import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createDraftPersistence, startAutosave } from './draft';
import { memoryStorage } from './library';
import { createStudioStore } from './store';
import { buildCatalog } from './catalog';

const doc = { priority: 1, borderRadius: { md: '4px' } };
const radius = buildCatalog(doc).find((c) => c.id === 'borderRadius.md')!;

describe('brouillon & préférences', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('enregistre le brouillon (anti-rebond) et le niveau', () => {
    const storage = memoryStorage();
    const draft = createDraftPersistence(storage, 'p');
    const store = createStudioStore(doc);
    const stop = startAutosave(store, draft);
    store.setValue(radius, '9px');
    store.setLevel('expert');
    expect(draft.loadDraft()).toBeNull(); // pas encore : anti-rebond
    vi.advanceTimersByTime(500);
    expect(draft.loadDraft()?.doc).toMatchObject({ borderRadius: { md: '9px' } });
    expect(draft.loadPrefs()).toEqual({ level: 'expert' });
    stop();
  });

  it('efface le brouillon quand il n’y a plus de modification (enregistré ou réinitialisé)', () => {
    const draft = createDraftPersistence(memoryStorage(), 'p');
    const store = createStudioStore(doc);
    startAutosave(store, draft);
    store.setValue(radius, '9px');
    vi.advanceTimersByTime(500);
    expect(draft.loadDraft()).not.toBeNull();
    store.resetAll();
    vi.advanceTimersByTime(500);
    expect(draft.loadDraft()).toBeNull();
  });

  it('ignore un stockage corrompu', () => {
    const s = memoryStorage();
    s.setItem('p:draft', '{oops');
    s.setItem('p:prefs', '[');
    const d = createDraftPersistence(s, 'p');
    expect(d.loadDraft()).toBeNull();
    expect(d.loadPrefs()).toEqual({});
  });
});
