import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mounted = vi.hoisted(() => ({ apps: [] as string[] }));
vi.mock('single-spa', () => ({ getMountedApps: () => mounted.apps }));

import { getActiveModuleNames, useActiveAppModules } from './useActiveAppModules';

describe('useActiveAppModules', () => {
  beforeEach(() => {
    mounted.apps = ['@egen/esm-primary-navigation-app-page-0', '@egen/esm-home-app-page-0'];
  });

  it('déduit le nom du module en retirant le suffixe -page-N des apps single-spa', () => {
    mounted.apps = ['@egen/esm-annuaire-app-page-2', '@egen/esm-annuaire-app-page-3', '@egen/esm-home-app-page-0'];
    expect([...getActiveModuleNames()].sort()).toEqual(['@egen/esm-annuaire-app', '@egen/esm-home-app']);
  });

  it('se met à jour à chaque changement de route et garde la même référence si rien ne change', () => {
    const { result } = renderHook(() => useActiveAppModules());
    const initial = result.current;
    expect(initial.has('@egen/esm-home-app')).toBe(true);

    act(() => window.dispatchEvent(new Event('single-spa:routing-event')));
    expect(result.current).toBe(initial);

    mounted.apps = ['@egen/esm-primary-navigation-app-page-0', '@egen/esm-sites-app-page-1'];
    act(() => window.dispatchEvent(new Event('single-spa:routing-event')));
    expect(result.current.has('@egen/esm-sites-app')).toBe(true);
    expect(result.current.has('@egen/esm-home-app')).toBe(false);
  });
});
