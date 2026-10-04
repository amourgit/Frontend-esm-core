/* eslint-disable testing-library/no-node-access, testing-library/no-container, testing-library/no-manual-cleanup, testing-library/no-render-in-lifecycle, jest-dom/prefer-in-document --
   Ces tests vérifient la structure rendue (régions ARIA de la galerie, lignes de tableau, images de fond) :
   il n'existe pas de requête Testing Library équivalente. */
import React from 'react';
import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
import { render, screen, cleanup, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { installBrowserStubs } from './test-utils/setup';
import { mountShellBackground } from './test-utils/shell-background';

vi.mock('@egen-civitas/esm-framework', async () => (await import('./test-utils/framework-mock')).frameworkMock());
vi.mock('@egen-civitas/tailwind-preset/tailwind.tw.css', () => ({}));

import Root from './root.component';
import { DIRECTORY_EMPLOYEES, getEmployeeUuid } from './data/directory-data';

let shellBg: HTMLElement;
beforeAll(installBrowserStubs);
beforeEach(async () => {
  cleanup();
  shellBg?.remove();
  shellBg = await mountShellBackground();
});

const go = (path: string) => {
  window.history.pushState({}, '', path);
  return render(<Root />);
};

describe('routes de l\'app Annuaire', () => {
  it.each(['/annuaire', '/annuaire/contacts'])('%s → annuaire, avec son fond rendu par le shell', async (path) => {
    const { container } = go(path);
    expect(screen.getByText('Annuaire des Collaborateurs')).toBeInTheDocument();
    // le fond est dans l'hôte du shell, pas dans l'arbre de l'app (racines React distinctes)
    await waitFor(() => expect(shellBg.querySelector('img[alt="Annuaire Collaborateurs"]')).not.toBeNull());
    expect(container.querySelector('img[alt="Annuaire Collaborateurs"]')).toBeNull();
  });

  it("l'app ne monte aucun arrière-plan elle-même : sans shell, aucun fond (évite le doublon)", async () => {
    shellBg.remove();
    cleanup();
    go('/annuaire');
    await screen.findByText('Annuaire des Collaborateurs');
    expect(document.querySelector('img[alt="Annuaire Collaborateurs"]')).toBeNull();
  });

  it('le fond disparaît du shell quand on quitte la page (démontage)', async () => {
    const { unmount } = go('/annuaire');
    await waitFor(() => expect(shellBg.querySelector('img[alt="Annuaire Collaborateurs"]')).not.toBeNull());
    unmount();
    await waitFor(() => expect(shellBg.querySelector('img[alt="Annuaire Collaborateurs"]')).toBeNull());
  });

  it('/annuaire/organigramme → onglet organigramme actif', () => {
    go('/annuaire/organigramme');
    expect(screen.getByRole('tab', { name: /Organigramme/i })).toHaveAttribute('aria-selected', 'true');
  });

  it('/annuaire/structures → onglet « À propos » actif', () => {
    go('/annuaire/structures');
    expect(screen.getByRole('tab', { name: /propos/i })).toHaveAttribute('aria-selected', 'true');
  });

  it('/annuaire/<uuid>/review → fiche du bon collaborateur, avec sa photo de couverture en fond (shell)', async () => {
    const emp = DIRECTORY_EMPLOYEES[3];
    go(`/annuaire/${getEmployeeUuid(emp)}/review`);
    expect(screen.getAllByText(emp.fullName).length).toBeGreaterThan(0);
    await waitFor(() =>
      expect(shellBg.querySelector(`img[alt="Photo de couverture de ${emp.fullName}"]`)).not.toBeNull(),
    );
  });

  it.each(['wishlist', 'loyalty', 'support', 'insight', 'activity', 'purchase-history'])('/annuaire/<uuid>/%s → fiche rendue', (tab) => {
    const emp = DIRECTORY_EMPLOYEES[1];
    go(`/annuaire/${getEmployeeUuid(emp)}/${tab}`);
    expect(screen.getAllByText(emp.fullName).length).toBeGreaterThan(0);
  });

  it('/annuaire/<uuid>/details/<tab> → fiche rendue', () => {
    const emp = DIRECTORY_EMPLOYEES[2];
    go(`/annuaire/${getEmployeeUuid(emp)}/details/wishlist`);
    expect(screen.getAllByText(emp.fullName).length).toBeGreaterThan(0);
  });

  it('le volet latéral affiche e-mail et téléphone du collaborateur', () => {
    const emp = DIRECTORY_EMPLOYEES[0];
    go(`/annuaire/${getEmployeeUuid(emp)}/review`);
    expect(screen.getAllByText(emp.email).length).toBeGreaterThan(0);
  });
});
