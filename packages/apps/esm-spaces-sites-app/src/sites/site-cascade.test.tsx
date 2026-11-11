import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { navigate, showSnackbar, useConfig } from '@egen-civitas/esm-framework';

vi.mock('@egen-civitas/esm-framework', async () => (await import('../test-utils/framework-mock')).createFrameworkMock());

import { resetTestStores } from '../test-utils/framework-mock';
import { getSpacesSitesStore, setActiveSite, setSites, type SiteNode } from '../store/spaces-sites.store';
import { buildCascadeLevels, SiteCascade } from './site-cascade.component';
import { buildSiteTree } from './site-tree';

const sites: SiteNode[] = [
  { id: 'dsi', name: 'Direction des Systèmes', shortName: 'DSI' },
  { id: 'drh', name: 'Ressources Humaines', shortName: 'DRH' },
  { id: 'dsi-infra', parentId: 'dsi', name: 'Infrastructure' },
  { id: 'dsi-dev', parentId: 'dsi', name: 'Développement' },
  { id: 'dsi-infra-reseau', parentId: 'dsi-infra', name: 'Réseau' },
  { id: 'dsi-infra-reseau-wifi', parentId: 'dsi-infra-reseau', name: 'Wi-Fi' },
];
const tree = buildSiteTree(sites);
const activeSite = () => getSpacesSitesStore().getState().siteId;
const levelSelects = () => screen.queryAllByRole('combobox');

describe('buildCascadeLevels', () => {
  it("sans site actif : un seul niveau, les racines", () => {
    const levels = buildCascadeLevels(tree, null);
    expect(levels).toHaveLength(1);
    expect(levels[0].items.map((s) => s.id)).toEqual(['dsi', 'drh']); // par nom : Direction… avant Ressources…
    expect(levels[0].parent).toBeNull();
  });

  it("chaque site actif qui a des enfants ouvre un niveau de plus, à profondeur illimitée", () => {
    const levels = buildCascadeLevels(tree, 'dsi-infra-reseau');
    expect(levels.map((l) => l.parent?.id ?? null)).toEqual([null, 'dsi', 'dsi-infra', 'dsi-infra-reseau']);
    expect(levels.map((l) => l.selected?.id ?? null)).toEqual(['dsi', 'dsi-infra', 'dsi-infra-reseau', null]);
  });

  it("un site sans enfant n'ouvre pas de niveau vide", () => {
    const levels = buildCascadeLevels(tree, 'dsi-infra-reseau-wifi');
    expect(levels).toHaveLength(4);
    expect(levels[levels.length - 1].selected?.id).toBe('dsi-infra-reseau-wifi');
  });

  it('un arbre vide ne produit aucun niveau', () => {
    expect(buildCascadeLevels(buildSiteTree([]), null)).toEqual([]);
  });

  it('suit une chaîne de 2 000 niveaux sans rien casser', () => {
    const chain = Array.from({ length: 2000 }, (_, i): SiteNode => ({ id: `n${i}`, parentId: i === 0 ? null : `n${i - 1}`, name: `N${i}` }));
    expect(buildCascadeLevels(buildSiteTree(chain), 'n1998')).toHaveLength(2000);
  });
});

describe('<SiteCascade />', () => {
  beforeEach(() => {
    resetTestStores();
    Object.assign(window, { getEgenBase: () => '/', getEgenSpaBase: () => '/spa/' });
    vi.mocked(useConfig).mockReturnValue({ sites: { items: [], route: '${egenSpaBase}/sites/{siteId}/applications', listRoute: '${egenSpaBase}/sites' } });
    setSites(sites);
  });

  it("n'affiche rien quand il n'y a aucun site", () => {
    const { container } = render(<SiteCascade tree={buildSiteTree([])} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('affiche d’abord un seul sélecteur : les racines', () => {
    render(<SiteCascade tree={tree} />);

    expect(levelSelects()).toHaveLength(1);
    expect(screen.getByRole('combobox', { name: /Site selection/i })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Direction des Systèmes' })).toBeInTheDocument();
  });

  it("choisir un site qui a des sous-sites ouvre la liste de ses enfants, active le site et navigue", async () => {
    render(<SiteCascade tree={tree} />);

    await userEvent.selectOptions(levelSelects()[0], 'dsi');

    expect(activeSite()).toBe('dsi');
    expect(navigate).toHaveBeenCalledWith({ to: '/spa/sites/dsi/applications' });
    expect(showSnackbar).toHaveBeenCalledWith(expect.objectContaining({ kind: 'success' }));
    expect(levelSelects()).toHaveLength(2);
    expect(screen.getByRole('option', { name: 'Infrastructure' })).toBeInTheDocument();
  });

  it("descend sans limite : un sélecteur de plus à chaque niveau choisi", async () => {
    render(<SiteCascade tree={tree} />);

    await userEvent.selectOptions(levelSelects()[0], 'dsi');
    await userEvent.selectOptions(levelSelects()[1], 'dsi-infra');
    await userEvent.selectOptions(levelSelects()[2], 'dsi-infra-reseau');
    await userEvent.selectOptions(levelSelects()[3], 'dsi-infra-reseau-wifi');

    expect(activeSite()).toBe('dsi-infra-reseau-wifi');
    expect(levelSelects()).toHaveLength(4);
    expect(navigate).toHaveBeenLastCalledWith({ to: '/spa/sites/dsi-infra-reseau-wifi/applications' });
  });

  it("revient d'un niveau quand on choisit « tout » à un niveau profond, sans toucher aux niveaux au-dessus", async () => {
    setActiveSite('dsi-infra');
    render(<SiteCascade tree={tree} />);
    expect(levelSelects()).toHaveLength(3);

    await userEvent.selectOptions(levelSelects()[2], '');
    expect(activeSite()).toBe('dsi-infra');

    await userEvent.selectOptions(levelSelects()[1], '');
    expect(activeSite()).toBe('dsi');
  });

  it("revenir à « tous les sites » depuis le premier niveau réinitialise et navigue vers la liste", async () => {
    setActiveSite('dsi');
    render(<SiteCascade tree={tree} />);

    await userEvent.selectOptions(levelSelects()[0], '');

    expect(activeSite()).toBeNull();
    expect(navigate).toHaveBeenCalledWith({ to: '/spa/sites' });
    expect(levelSelects()).toHaveLength(1);
  });

  it("ne navigue pas quand aucune route n'est configurée", async () => {
    vi.mocked(useConfig).mockReturnValue({ sites: { items: [], route: '', listRoute: '' } });
    render(<SiteCascade tree={tree} />);

    await userEvent.selectOptions(levelSelects()[0], 'drh');

    expect(activeSite()).toBe('drh');
    expect(navigate).not.toHaveBeenCalled();
  });

  it("reflète un site activé ailleurs (URL, autre app) : le chemin s'affiche déjà sélectionné", () => {
    setActiveSite('dsi-infra-reseau');
    render(<SiteCascade tree={tree} />);

    expect(levelSelects()).toHaveLength(4);
    expect(levelSelects()[0]).toHaveValue('dsi');
    expect(levelSelects()[1]).toHaveValue('dsi-infra');
    expect(levelSelects()[2]).toHaveValue('dsi-infra-reseau');
    expect(levelSelects()[3]).toHaveValue('');
  });
});
