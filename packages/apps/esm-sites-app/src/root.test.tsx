/* eslint-disable testing-library/no-node-access, testing-library/no-container, testing-library/no-manual-cleanup --
   Les tests vérifient des régions ARIA (onglets, cartes du carrousel) et les images de fond rendues par le shell. */
import React from 'react';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { installBrowserStubs } from './test-utils/setup';
import { mountShellBackground } from './test-utils/shell-background';

vi.mock('@egen-civitas/esm-framework', async () => (await import('./test-utils/framework-mock')).frameworkMock());
vi.mock('@egen-civitas/tailwind-preset/tailwind.tw.css', () => ({}));

import Root from './root.component';
import { SITES } from './data/sites-data';

let shellBg: HTMLElement;
beforeAll(installBrowserStubs);
beforeEach(async () => {
  cleanup();
  shellBg?.remove();
  shellBg = await mountShellBackground();
});
afterEach(() => cleanup());

const go = (path: string) => {
  window.history.pushState({}, '', path);
  return render(<Root />);
};

const dsi = SITES[0];

describe("routes de l'app Sites", () => {
  it('/sites → carrousel des sites, avec son fond rendu par le shell', async () => {
    const { container } = go('/sites');
    expect(screen.getAllByRole('button', { name: new RegExp(dsi.name) }).length).toBeGreaterThan(0);
    expect(screen.getByRole('textbox', { name: /Rechercher un site/i })).toBeInTheDocument();
    await waitFor(() => expect(shellBg.querySelector('img[alt="Sites & Directions"]')).not.toBeNull());
    expect(container.querySelector('img[alt="Sites & Directions"]')).toBeNull();
  });

  it('la recherche filtre le carrousel et affiche un état vide', () => {
    go('/sites');
    const input = screen.getByRole('textbox', { name: /Rechercher un site/i });
    fireEvent.change(input, { target: { value: 'zzz-introuvable' } });
    expect(screen.getByText(/Aucun site ne correspond/i)).toBeInTheDocument();
    fireEvent.change(input, { target: { value: 'DRH' } });
    expect(screen.queryByText(/Aucun site ne correspond/i)).toBeNull();
  });

  it("/sites/:id → redirige vers l'onglet applications", async () => {
    go(`/sites/${dsi.uuid}`);
    expect(await screen.findByText('Applications & Outils Métier')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Applications/i })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('heading', { level: 1, name: dsi.name })).toBeInTheDocument();
    expect(window.location.pathname).toBe(`/sites/${dsi.uuid}/applications`);
  });

  it.each([
    ['membres', /Membres & Équipes —/, /Membres/i],
    ['ressources', /Ressources Documentaires/, /Ressources/i],
    ['taches', /Mes tâches —/, /tâches/i],
    ['activite', /Journal d'Audit/, /Activité/i],
    ['parametres', /Paramètres du Site —/, /Paramètres/i],
  ])('/sites/:id/%s → page distincte, onglet actif', (tab, content, tabName) => {
    go(`/sites/${dsi.uuid}/${tab}`);
    expect(screen.getAllByText(content).length).toBeGreaterThan(0);
    expect(screen.getByRole('tab', { name: tabName })).toHaveAttribute('aria-selected', 'true');
  });

  it("un clic sur un onglet change la route et la page", async () => {
    go(`/sites/${dsi.uuid}/applications`);
    fireEvent.click(screen.getByRole('tab', { name: /Mes tâches/i }));
    expect(await screen.findByText(/Mes tâches — /)).toBeInTheDocument();
    expect(window.location.pathname).toBe(`/sites/${dsi.uuid}/taches`);
  });

  it('site inconnu → retour à la liste ; onglet inconnu → applications', async () => {
    go('/sites/srv-inexistant/membres');
    expect(await screen.findByRole('textbox', { name: /Rechercher un site/i })).toBeInTheDocument();
    cleanup();
    go(`/sites/${dsi.uuid}/nimporte-quoi`);
    expect(await screen.findByText('Applications & Outils Métier')).toBeInTheDocument();
  });

  it("le fond disparaît du shell quand on quitte l'app (démontage)", async () => {
    const { unmount } = go('/sites');
    await waitFor(() => expect(shellBg.querySelector('img[alt="Sites & Directions"]')).not.toBeNull());
    unmount();
    await waitFor(() => expect(shellBg.querySelector('img[alt="Sites & Directions"]')).toBeNull());
  });
});
