import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { navigate } from '@egen-civitas/esm-framework';

vi.mock('@egen-civitas/esm-framework', async () => (await import('../test-utils/framework-mock')).createFrameworkMock());

import { resetTestStores } from '../test-utils/framework-mock';
import { getSpacesSitesStore, setSites } from '../store/spaces-sites.store';
import { goTo, goToSite, siteHref, useSiteFromUrl } from './site-route';
import { buildSiteTree } from './site-tree';

const sites = [{ id: 'dsi', name: 'DSI' }, { id: 'dsi-infra', parentId: 'dsi', name: 'Infra' }];
const tree = buildSiteTree(sites);
const activeSite = () => getSpacesSitesStore().getState().siteId;

describe('routes de site', () => {
  beforeEach(() => {
    resetTestStores();
    Object.assign(window, { getEgenBase: () => '/', getEgenSpaBase: () => '/spa/' });
  });

  it("construit l'adresse d'un site depuis le modèle de la config", () => {
    expect(siteHref('${egenSpaBase}/sites/{siteId}/applications', 'dsi')).toBe('/spa/sites/dsi/applications');
    expect(siteHref('${egenSpaBase}/sites/{siteId}', 'a b')).toBe('/spa/sites/a%20b');
  });

  it("un modèle vide ne navigue pas", () => {
    expect(siteHref('', 'dsi')).toBeNull();
    goToSite('', 'dsi');
    goTo('');
    expect(navigate).not.toHaveBeenCalled();
  });

  it("navigue vers le site choisi, ou vers la liste", () => {
    goToSite('${egenSpaBase}/sites/{siteId}/applications', 'dsi');
    expect(navigate).toHaveBeenLastCalledWith({ to: '/spa/sites/dsi/applications' });
    goTo('${egenSpaBase}/sites');
    expect(navigate).toHaveBeenLastCalledWith({ to: '/spa/sites' });
  });

  describe('useSiteFromUrl', () => {
    beforeEach(() => setSites(sites));

    it("active le site le plus profond du chemin au montage", () => {
      window.history.pushState({}, '', '/spa/sites/dsi-infra/applications');
      renderHook(() => useSiteFromUrl(tree));
      expect(activeSite()).toBe('dsi-infra');
    });

    it("suit les changements de route de single-spa", () => {
      window.history.pushState({}, '', '/spa/home');
      renderHook(() => useSiteFromUrl(tree));
      expect(activeSite()).toBeNull();

      window.history.pushState({}, '', '/spa/sites/dsi/applications');
      window.dispatchEvent(new Event('single-spa:routing-event'));
      expect(activeSite()).toBe('dsi');
    });

    it("conserve le choix fait dans la TopBar quand l'URL n'indique aucun site", () => {
      window.history.pushState({}, '', '/spa/sites/dsi');
      renderHook(() => useSiteFromUrl(tree));
      window.history.pushState({}, '', '/spa/home');
      window.dispatchEvent(new Event('popstate'));
      expect(activeSite()).toBe('dsi');
    });

    it('cesse d’écouter au démontage', () => {
      window.history.pushState({}, '', '/spa/home');
      const { unmount } = renderHook(() => useSiteFromUrl(tree));
      unmount();
      window.history.pushState({}, '', '/spa/sites/dsi');
      window.dispatchEvent(new Event('single-spa:routing-event'));
      expect(activeSite()).toBeNull();
    });
  });
});
