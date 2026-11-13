import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

const state = { config: { runtime: 'esm-theme', applyPriority: 100, requiredPrivilege: '', storageKey: 't' }, user: { privileges: [] as string[] } as unknown, has: vi.fn(() => true) };

vi.mock('@egen-civitas/esm-framework', () => ({ useConfig: () => state.config, useSession: () => ({ user: state.user }), userHasAccess: (...a: unknown[]) => (state.has as any)(...a) }));
vi.mock('./core/runtime-factory', async () => {
  const { createEsmThemeRuntime } = await import('./core/runtime');
  return {
    createRuntime: () =>
      createEsmThemeRuntime({
        flattenToCssVars: () => ({ base: {}, light: {}, dark: {} }),
        applyGlobalThemeOverride: () => undefined,
        removeGlobalThemeOverride: () => undefined,
        getThemeState: () => ({ mode: 'light', activeTheme: { schema: { priority: 1, meta: { name: 'Actif' } } } }),
        setThemeMode: () => undefined,
      }),
  };
});

import Root from './root.component';

afterEach(cleanup);

describe('Root', () => {
  it('ouvre le Studio sur le thème actif de l’environnement', () => {
    render(<Root />);
    expect(screen.getByTestId('theme-studio')).toBeTruthy();
    expect((screen.getByLabelText('Nom du thème') as HTMLInputElement).value).toBe('Actif');
  });

  it('refuse l’accès sans le privilège requis', () => {
    state.config = { ...state.config, requiredPrivilege: 'Manage Themes' };
    state.has.mockReturnValue(false);
    render(<Root />);
    expect(screen.getByRole('alert').textContent).toContain('pas le droit');
    expect(screen.queryByTestId('theme-studio')).toBeNull();
  });
});
