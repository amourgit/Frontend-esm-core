import { describe, expect, it, vi } from 'vitest';
import { applyToProject, buildThemeDoc } from './apply';
import type { ThemeRuntimePort } from '../core/runtime';

const styles = {
  light: {
    background: '#ffffff',
    foreground: '#111111',
    primary: '#b25bc8',
    'primary-foreground': '#ffffff',
    radius: '0.5rem',
  },
  dark: { background: '#111111', foreground: '#ffffff', primary: '#b25bc8', 'primary-foreground': '#ffffff' },
} as never;

const makeRuntime = (active: Record<string, unknown> | null): ThemeRuntimePort => ({
  id: 'test',
  previewVars: () => ({}),
  apply: vi.fn(),
  revert: vi.fn(),
  isApplied: () => false,
  getActiveTheme: () => active,
  getMode: () => 'light',
  setMode: vi.fn(),
  subscribeMode: () => () => undefined,
});

describe('apply (éditeur → thème EGEN → moteur)', () => {
  it('conserve les tokens du thème actif que TweakCN ne connaît pas', () => {
    const doc = buildThemeDoc({ custom: { keep: 'me' } }, styles);
    expect(doc.custom).toEqual({ keep: 'me' });
    expect(Object.keys(doc).length).toBeGreaterThan(1);
  });

  it('passe le JSON construit au moteur avec la priorité et l’id du Studio', () => {
    const runtime = makeRuntime({ custom: { keep: 'me' } });
    const doc = applyToProject(runtime, styles, 100);
    expect(runtime.apply).toHaveBeenCalledWith(doc, { priority: 100, id: 'theme-studio' });
  });

  it('fonctionne sans thème actif', () => {
    const runtime = makeRuntime(null);
    expect(() => applyToProject(runtime, styles, 50)).not.toThrow();
    expect(runtime.apply).toHaveBeenCalledTimes(1);
  });
});
