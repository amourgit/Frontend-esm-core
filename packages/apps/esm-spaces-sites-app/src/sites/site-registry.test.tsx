import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useConfig, useExtensionSlotMeta } from '@egen-civitas/esm-framework';

vi.mock('@egen-civitas/esm-framework', async () => (await import('../test-utils/framework-mock')).createFrameworkMock());

import { resetTestStores } from '../test-utils/framework-mock';
import { getSpacesSitesStore } from '../store/spaces-sites.store';
import { SITES_REGISTRY_SLOT, sitesFromConfig, sitesFromDeclarations, useSiteRegistry } from './site-registry';

const mockUseConfig = vi.mocked(useConfig);
const mockUseExtensionSlotMeta = vi.mocked(useExtensionSlotMeta);

describe('sitesFromDeclarations', () => {
  it('lit `meta.site` de chaque extension et ignore les déclarations invalides', () => {
    const sites = sitesFromDeclarations({
      'site-dsi': { site: { id: 'dsi', name: 'DSI' } },
      'site-sans-nom': { site: { id: 'x' } },
      'sans-site': { section: 'autre' },
      'meta-vide': null,
    });

    expect(sites).toEqual([{ id: 'dsi', name: 'DSI' }]);
  });

  it('accepte aucune déclaration', () => {
    expect(sitesFromDeclarations(undefined)).toEqual([]);
  });
});

describe('sitesFromConfig', () => {
  it('retire les champs vides et les entrées invalides', () => {
    const sites = sitesFromConfig([
      { id: 'a', parentId: '', name: 'A', shortName: '', category: '', description: '', order: 0 },
      { id: 'a1', parentId: 'a', name: 'A1', shortName: 'AA', category: 'Pôle', description: 'Desc', order: 2 },
      { id: '', parentId: '', name: 'Sans id', shortName: '', category: '', description: '', order: 0 },
    ]);

    expect(sites).toEqual([
      { id: 'a', name: 'A' },
      { id: 'a1', parentId: 'a', name: 'A1', shortName: 'AA', category: 'Pôle', description: 'Desc', order: 2 },
    ]);
  });
});

describe('useSiteRegistry', () => {
  beforeEach(() => {
    resetTestStores();
    mockUseConfig.mockReturnValue({ sites: { items: [], route: '', listRoute: '' } });
    mockUseExtensionSlotMeta.mockReturnValue({});
  });

  it("lit le slot de données `sites-registry-slot`", () => {
    renderHook(() => useSiteRegistry());
    expect(mockUseExtensionSlotMeta).toHaveBeenCalledWith(SITES_REGISTRY_SLOT);
    expect(SITES_REGISTRY_SLOT).toBe('sites-registry-slot');
  });

  it("assemble les sites des apps ET ceux de la configuration en un seul arbre, et les publie dans le store", () => {
    mockUseExtensionSlotMeta.mockReturnValue({
      'site-dsi': { site: { id: 'dsi', name: 'DSI' } },
      'site-drh': { site: { id: 'drh', name: 'DRH' } },
    });
    mockUseConfig.mockReturnValue({
      sites: { items: [{ id: 'dsi-infra', parentId: 'dsi', name: 'Infra', shortName: '', category: '', description: '', order: 0 }], route: '', listRoute: '' },
    });

    const { result } = renderHook(() => useSiteRegistry());

    expect(result.current.sites.map((s) => s.id)).toEqual(['dsi', 'drh', 'dsi-infra']);
    expect(result.current.tree.childrenOf.get('dsi')?.map((s) => s.id)).toEqual(['dsi-infra']);
    expect(getSpacesSitesStore().getState().sites.map((s) => s.id)).toEqual(['dsi', 'drh', 'dsi-infra']);
  });

  it("la configuration du déploiement complète une déclaration d'app (même identifiant)", () => {
    mockUseExtensionSlotMeta.mockReturnValue({ 'site-dsi': { site: { id: 'dsi', name: 'DSI', shortName: 'DSI' } } });
    mockUseConfig.mockReturnValue({ sites: { items: [{ id: 'dsi', parentId: '', name: 'Direction numérique', shortName: '', category: '', description: '', order: 0 }], route: '', listRoute: '' } });

    const { result } = renderHook(() => useSiteRegistry());

    expect(result.current.sites).toEqual([{ id: 'dsi', name: 'Direction numérique', shortName: 'DSI' }]);
  });

  it("signale les anomalies corrigées dans la console", () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    mockUseExtensionSlotMeta.mockReturnValue({ orphelin: { site: { id: 'x', parentId: 'absent', name: 'X' } } });

    renderHook(() => useSiteRegistry());

    expect(warn).toHaveBeenCalledWith(expect.stringContaining('[spaces-sites]'));
  });

  it("ne change pas la référence de l'arbre à chaque rendu (pas de boucle de rendu)", () => {
    const declared = { 'site-dsi': { site: { id: 'dsi', name: 'DSI' } } };
    mockUseExtensionSlotMeta.mockReturnValue(declared);

    const { result, rerender } = renderHook(() => useSiteRegistry());
    const first = result.current.tree;
    rerender();

    expect(result.current.tree).toBe(first);
  });
});
