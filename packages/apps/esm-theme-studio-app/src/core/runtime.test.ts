import { afterEach, describe, expect, it, vi } from 'vitest';
import { createEsmThemeRuntime, registerThemeRuntime, selectRuntime, unregisterThemeRuntime, type EsmThemeApi } from './runtime';

const makeApi = () => {
  const calls: unknown[][] = [];
  let mode: 'light' | 'dark' = 'dark';
  const api: EsmThemeApi = {
    flattenToCssVars: () => ({ base: { '--border-radius-md': '4px' }, light: { '--colors-surface-background': '#fff' }, dark: { '--colors-surface-background': '#000' } }),
    applyGlobalThemeOverride: (s, o) => void calls.push(['apply', s, o]),
    removeGlobalThemeOverride: (id) => void calls.push(['remove', id]),
    getThemeState: () => ({ mode, activeTheme: { schema: { priority: 1, colors: {} } } }),
    setThemeMode: (m) => void (mode = m),
  };
  return { api, calls };
};

describe('EsmThemeRuntime', () => {
  it('previewVars fusionne base + jeu du mode demandé (indépendant du mode global)', () => {
    const { api } = makeApi();
    const rt = createEsmThemeRuntime(api);
    expect(rt.previewVars({}, 'light')).toEqual({ '--border-radius-md': '4px', '--colors-surface-background': '#fff' });
    expect(rt.previewVars({}, 'dark')['--colors-surface-background']).toBe('#000');
  });

  it('apply / revert pilotent l’override global et l’état', () => {
    const { api, calls } = makeApi();
    const rt = createEsmThemeRuntime(api);
    expect(rt.isApplied()).toBe(false);
    rt.apply({ priority: 1 }, { priority: 100 });
    expect(calls[0]).toEqual(['apply', { priority: 1 }, { id: 'theme-studio', priority: 100 }]);
    expect(rt.isApplied()).toBe(true);
    rt.revert();
    expect(calls[1]).toEqual(['remove', 'theme-studio']);
    expect(rt.isApplied()).toBe(false);
  });

  it('getActiveTheme renvoie une copie et le mode suit le moteur', () => {
    const { api } = makeApi();
    const rt = createEsmThemeRuntime(api);
    const a = rt.getActiveTheme()!;
    a.priority = 99;
    expect(rt.getActiveTheme()!.priority).toBe(1);
    rt.setMode('light');
    expect(rt.getMode()).toBe('light');
  });
});

describe('selectRuntime (TokiForge)', () => {
  afterEach(() => unregisterThemeRuntime('tokiforge'));
  const base = createEsmThemeRuntime(makeApi().api);

  it('retourne le runtime par défaut quand il est demandé', () => {
    expect(selectRuntime('esm-theme', base)).toBe(base);
  });
  it('replie sur esm-theme avec avertissement si TokiForge n’est pas encore enregistré', () => {
    const warn = vi.fn();
    expect(selectRuntime('tokiforge', base, warn)).toBe(base);
    expect(warn).toHaveBeenCalledOnce();
  });
  it('utilise l’adaptateur TokiForge dès qu’il est enregistré', () => {
    const toki = { ...base, id: 'tokiforge' };
    registerThemeRuntime(toki);
    expect(selectRuntime('tokiforge', base)).toBe(toki);
  });
});
