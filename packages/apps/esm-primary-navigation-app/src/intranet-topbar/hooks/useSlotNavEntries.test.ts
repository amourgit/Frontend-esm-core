import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useExtensionSlotMeta } from '@egen-civitas/esm-framework';
import { useSlotNavEntries } from './useSlotNavEntries';

vi.mock('@egen-civitas/esm-framework', () => ({
  TOPBAR_NAV_SLOT: 'topbar-nav-slot',
  TOPBAR_LEVEL2_NAV_SLOT: 'topbar-level2-nav',
  useExtensionSlotMeta: vi.fn(),
  isNavEntryMeta: (m: unknown) => Boolean(m && typeof m === 'object' && 'section' in m && 'label' in m && 'route' in m),
}));

const meta = (route: string) => ({ section: 'docs', label: route, route });

describe('useSlotNavEntries', () => {
  it('fusionne les entrées du slot officiel et de l’ancien slot, et ignore les meta invalides', () => {
    vi.mocked(useExtensionSlotMeta).mockImplementation(((slot: string) =>
      slot === 'topbar-nav-slot'
        ? { neuf: meta('docs/neuf') }
        : { ancien: meta('docs/ancien'), casse: { section: 'docs' } }) as typeof useExtensionSlotMeta);

    const { result } = renderHook(() => useSlotNavEntries());
    expect(result.current.map((e) => e.name).sort()).toEqual(['ancien', 'neuf']);
  });

  it('en cas de même nom sur les deux slots, le slot officiel l’emporte', () => {
    vi.mocked(useExtensionSlotMeta).mockImplementation(((slot: string) =>
      slot === 'topbar-nav-slot'
        ? { x: meta('docs/officiel') }
        : { x: meta('docs/ancien') }) as typeof useExtensionSlotMeta);

    const { result } = renderHook(() => useSlotNavEntries());
    expect(result.current).toHaveLength(1);
    expect(result.current[0].meta.route).toBe('docs/officiel');
  });
});
