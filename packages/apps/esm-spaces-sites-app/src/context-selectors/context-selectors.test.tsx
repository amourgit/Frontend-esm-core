import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { showSnackbar, useConfig, useExtensionSlotMeta } from '@egen-civitas/esm-framework';

vi.mock('@egen-civitas/esm-framework', async () => (await import('../test-utils/framework-mock')).createFrameworkMock());

import { resetTestStores } from '../test-utils/framework-mock';
import { getSpacesSitesStore } from '../store/spaces-sites.store';
import ContextSelectors from './context-selectors.component';
import SpaceMenu from '../spaces/space-menu.component';

const baseConfig = {
  spaces: [
    { id: 'intranet', name: 'Intranet', subtitle: '' },
    { id: 'extranet', name: 'Extranet', subtitle: '' },
  ],
  defaultSpaceId: 'intranet',
  sites: { items: [], route: '', listRoute: '' },
  selectors: { showSpaces: true, showSites: true },
};
const state = () => getSpacesSitesStore().getState();

describe('<ContextSelectors />', () => {
  beforeEach(() => {
    resetTestStores();
    Object.assign(window, { getEgenBase: () => '/', getEgenSpaBase: () => '/spa/' });
    vi.mocked(useConfig).mockReturnValue(baseConfig);
    vi.mocked(useExtensionSlotMeta).mockReturnValue({ 'site-dsi': { site: { id: 'dsi', name: 'DSI' } } });
  });

  it("initialise les Espaces depuis la configuration et active l'Espace par défaut", () => {
    render(<ContextSelectors />);

    expect(state().spaces.map((s) => s.id)).toEqual(['intranet', 'extranet']);
    expect(state().spaceId).toBe('intranet');
    expect(screen.getByRole('combobox', { name: 'espace' })).toHaveValue('intranet');
  });

  it("change d'Espace : met à jour le store partagé et prévient l'utilisateur", async () => {
    render(<ContextSelectors />);

    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'espace' }), 'extranet');

    expect(state().spaceId).toBe('extranet');
    expect(showSnackbar).toHaveBeenCalledWith(expect.objectContaining({ kind: 'success' }));
  });

  it("affiche aussi la cascade de sites déclarés par les apps, et publie le registre", () => {
    render(<ContextSelectors />);

    expect(screen.getByRole('combobox', { name: /Site selection/i })).toBeInTheDocument();
    expect(state().sites).toEqual([{ id: 'dsi', name: 'DSI' }]);
  });

  it("peut masquer le sélecteur d'Espace (déploiement à Espace unique)", () => {
    vi.mocked(useConfig).mockReturnValue({ ...baseConfig, selectors: { showSpaces: false, showSites: true } });
    render(<ContextSelectors />);

    expect(screen.queryByRole('combobox', { name: 'espace' })).not.toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: /Site selection/i })).toBeInTheDocument();
  });

  it("peut masquer la cascade de sites, tout en gardant le registre publié pour les autres apps", () => {
    vi.mocked(useConfig).mockReturnValue({ ...baseConfig, selectors: { showSpaces: true, showSites: false } });
    render(<ContextSelectors />);

    expect(screen.queryByRole('combobox', { name: /Site selection/i })).not.toBeInTheDocument();
    expect(state().sites).toEqual([{ id: 'dsi', name: 'DSI' }]);
  });

  it("se met à jour à chaud quand la configuration change", () => {
    const { rerender } = render(<ContextSelectors />);
    expect(screen.getAllByRole('option', { name: /Extranet/ })).toHaveLength(1);

    vi.mocked(useConfig).mockReturnValue({ ...baseConfig, spaces: [...baseConfig.spaces, { id: 'partenaires', name: 'Partenaires', subtitle: '' }] });
    rerender(<ContextSelectors />);

    expect(screen.getByRole('option', { name: 'Partenaires' })).toBeInTheDocument();
  });

  it("n'affiche aucun Espace quand la configuration n'en déclare pas", () => {
    vi.mocked(useConfig).mockReturnValue({ ...baseConfig, spaces: [] });
    render(<ContextSelectors />);

    expect(screen.queryByRole('combobox', { name: 'espace' })).not.toBeInTheDocument();
  });
});

describe('<SpaceMenu /> (panneau latéral)', () => {
  beforeEach(() => {
    resetTestStores();
    vi.mocked(useConfig).mockReturnValue(baseConfig);
  });

  it("partage l'Espace actif avec la TopBar et referme le panneau après un changement", async () => {
    const closeMenu = vi.fn();
    render(<SpaceMenu closeMenu={closeMenu} />);
    expect(screen.getByRole('combobox', { name: 'espace' })).toHaveValue('intranet');

    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'espace' }), 'extranet');

    expect(state().spaceId).toBe('extranet');
    expect(closeMenu).toHaveBeenCalledTimes(1);
  });

  it("ne referme pas le panneau quand l'Espace ne change pas", async () => {
    const closeMenu = vi.fn();
    render(<SpaceMenu closeMenu={closeMenu} />);

    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'espace' }), 'intranet');

    expect(closeMenu).not.toHaveBeenCalled();
  });
});
