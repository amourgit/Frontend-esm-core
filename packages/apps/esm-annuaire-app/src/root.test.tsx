/* eslint-disable testing-library/no-node-access, testing-library/no-container, testing-library/no-manual-cleanup, testing-library/no-render-in-lifecycle, jest-dom/prefer-in-document --
   Ces tests vérifient la structure rendue (régions ARIA de la galerie, lignes de tableau, images de fond) :
   il n'existe pas de requête Testing Library équivalente. */
import React from 'react';
import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { installBrowserStubs } from './test-utils/setup';

vi.mock('@egen-civitas/esm-framework', async () => (await import('./test-utils/framework-mock')).frameworkMock());
vi.mock('@egen-civitas/tailwind-preset/tailwind.tw.css', () => ({}));

import Root from './root.component';
import { DIRECTORY_EMPLOYEES, getEmployeeUuid } from './data/directory-data';

beforeAll(installBrowserStubs);
beforeEach(() => cleanup());

const go = (path: string) => {
  window.history.pushState({}, '', path);
  return render(<Root />);
};

describe('routes de l\'app Annuaire', () => {
  it.each(['/annuaire', '/annuaire/contacts'])('%s → annuaire, avec son fond de page', (path) => {
    const { container } = go(path);
    expect(screen.getByText('Annuaire des Collaborateurs')).toBeInTheDocument();
    expect(container.querySelector('img[alt="Annuaire Collaborateurs"]')).not.toBeNull();
  });

  it('/annuaire/organigramme → onglet organigramme actif', () => {
    go('/annuaire/organigramme');
    expect(screen.getByRole('tab', { name: /Organigramme/i })).toHaveAttribute('aria-selected', 'true');
  });

  it('/annuaire/structures → onglet « À propos » actif', () => {
    go('/annuaire/structures');
    expect(screen.getByRole('tab', { name: /propos/i })).toHaveAttribute('aria-selected', 'true');
  });

  it('/annuaire/<uuid>/review → fiche du bon collaborateur, avec sa photo de couverture en fond', () => {
    const emp = DIRECTORY_EMPLOYEES[3];
    const { container } = go(`/annuaire/${getEmployeeUuid(emp)}/review`);
    expect(screen.getAllByText(emp.fullName).length).toBeGreaterThan(0);
    expect(container.querySelector(`img[alt="Photo de couverture de ${emp.fullName}"]`)).not.toBeNull();
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
