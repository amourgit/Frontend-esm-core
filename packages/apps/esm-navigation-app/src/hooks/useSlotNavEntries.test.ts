import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useExtensionSlotMeta } from '@egen-civitas/esm-framework';
import { useSlotNavEntries } from './useSlotNavEntries';

vi.mock('@egen-civitas/esm-framework', () => ({
  TOPBAR_NAV_SLOT: 'topbar-nav-slot',
  useExtensionSlotMeta: vi.fn(),
  isNavEntryMeta: (m: unknown) => Boolean(m && typeof m === 'object' && 'section' in m && 'label' in m && 'route' in m),
}));

const meta = (route: string) => ({ section: 'docs', label: route, route });

describe('useSlotNavEntries', () => {
  it('lit le slot neutre de navigation et ignore les meta invalides', () => {
    vi.mocked(useExtensionSlotMeta).mockImplementation(((slot: string) =>
      slot === 'topbar-nav-slot'
        ? { a: meta('docs/a'), b: meta('docs/b'), casse: { section: 'docs' } }
        : {}) as typeof useExtensionSlotMeta);

    const { result } = renderHook(() => useSlotNavEntries());
    expect(result.current.map((e) => e.name).sort()).toEqual(['a', 'b']);
    expect(result.current[0].meta.route).toMatch(/^docs\//);
  });
});
