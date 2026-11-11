import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@egen-civitas/esm-framework', async () => (await import('../test-utils/framework-mock')).createFrameworkMock());

import { resetTestStores } from '../test-utils/framework-mock';
import {
  getSpacesSitesStore,
  initializeSpaces,
  setActiveSite,
  setActiveSpace,
  setSites,
  SPACES_SITES_STORE,
} from './spaces-sites.store';

const spaces = [
  { id: 'intranet', name: 'Intranet' },
  { id: 'extranet', name: 'Extranet' },
];
const state = () => getSpacesSitesStore().getState();

describe('store du contexte Espace / Site', () => {
  beforeEach(() => resetTestStores());

  it("s'appelle `egen-spaces-sites` : le contrat que les autres apps lisent sans dépendance de code", () => {
    expect(SPACES_SITES_STORE).toBe('egen-spaces-sites');
    expect(state()).toEqual({ spaces: [], spaceId: null, sites: [], siteId: null });
  });

  describe('initializeSpaces', () => {
    it("active l'Espace par défaut demandé", () => {
      initializeSpaces(spaces, 'extranet');
      expect(state().spaceId).toBe('extranet');
    });

    it("retombe sur le premier Espace si le défaut n'existe pas", () => {
      initializeSpaces(spaces, 'inconnu');
      expect(state().spaceId).toBe('intranet');
    });

    it("conserve l'Espace déjà actif quand la liste est republiée", () => {
      initializeSpaces(spaces, 'intranet');
      setActiveSpace('extranet');
      initializeSpaces(spaces, 'intranet');
      expect(state().spaceId).toBe('extranet');
    });

    it("quitte un Espace actif retiré de la configuration", () => {
      initializeSpaces(spaces, 'intranet');
      setActiveSpace('extranet');
      initializeSpaces([spaces[0]], 'intranet');
      expect(state().spaceId).toBe('intranet');
    });

    it("ignore les Espaces invalides et les doublons", () => {
      initializeSpaces([{ id: '', name: 'x' }, { id: 'a', name: 'A' }, { id: 'a', name: 'Doublon' }, null, { id: 'b' }], 'a');
      expect(state().spaces).toEqual([{ id: 'a', name: 'A' }]);
    });

    it('sans Espace valide, aucun Espace actif', () => {
      initializeSpaces([], 'intranet');
      expect(state().spaceId).toBeNull();
    });

    it("est idempotent : sans changement, le store n'est pas notifié", () => {
      initializeSpaces(spaces, 'intranet');
      const listener = vi.fn();
      getSpacesSitesStore().subscribe(listener);
      initializeSpaces([...spaces.map((s) => ({ ...s }))], 'intranet');
      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe('setActiveSpace', () => {
    it("change d'Espace connu, ignore l'inconnu", () => {
      initializeSpaces(spaces, 'intranet');
      setActiveSpace('extranet');
      expect(state().spaceId).toBe('extranet');
      setActiveSpace('nimporte-quoi');
      expect(state().spaceId).toBe('extranet');
    });
  });

  describe('sites', () => {
    const sites = [{ id: 'dsi', name: 'DSI' }, { id: 'dsi-infra', parentId: 'dsi', name: 'Infra' }];

    it('publie le registre et laisse activer un site de n’importe quel niveau', () => {
      setSites(sites);
      setActiveSite('dsi-infra');
      expect(state().siteId).toBe('dsi-infra');
      setActiveSite(null);
      expect(state().siteId).toBeNull();
    });

    it('ignore un site inconnu', () => {
      setSites(sites);
      setActiveSite('fantome');
      expect(state().siteId).toBeNull();
    });

    it("réinitialise le site actif s'il disparaît du registre, le garde sinon", () => {
      setSites(sites);
      setActiveSite('dsi-infra');
      setSites([...sites, { id: 'drh', name: 'DRH' }]);
      expect(state().siteId).toBe('dsi-infra');
      setSites([{ id: 'drh', name: 'DRH' }]);
      expect(state().siteId).toBeNull();
    });
  });
});
