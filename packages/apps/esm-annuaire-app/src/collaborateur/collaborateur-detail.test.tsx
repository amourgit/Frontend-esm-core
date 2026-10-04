/* eslint-disable testing-library/no-node-access, testing-library/no-container, testing-library/no-manual-cleanup, testing-library/no-render-in-lifecycle, jest-dom/prefer-in-document --
   Ces tests vérifient la structure rendue (régions ARIA de la galerie, lignes de tableau, images de fond) :
   il n'existe pas de requête Testing Library équivalente. */
import React from 'react';
import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
import { render, screen, cleanup, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { installBrowserStubs } from '../test-utils/setup';
import { mountShellBackground } from '../test-utils/shell-background';

vi.mock('@egen-civitas/esm-framework', async () => (await import('../test-utils/framework-mock')).frameworkMock());
vi.mock('@egen-civitas/tailwind-preset/tailwind.tw.css', () => ({}));

import { showToast } from '@egen-civitas/esm-framework';
import Root from '../root.component';
import { DIRECTORY_EMPLOYEES, getEmployeeUuid } from '../data/directory-data';

const uuidOf = (i: number) => getEmployeeUuid(DIRECTORY_EMPLOYEES[i]);
const open = (i: number, tab = 'review') => {
  window.history.pushState({}, '', `/annuaire/${uuidOf(i)}/${tab}`);
  render(<Root />);
};
beforeAll(installBrowserStubs);
let shellBg: HTMLElement;
beforeEach(async () => {
  cleanup();
  shellBg?.remove();
  shellBg = await mountShellBackground();
  vi.mocked(showToast).mockClear();
});

describe('fiche collaborateur', () => {
  it("« Retour à l'annuaire » ramène sur /annuaire", () => {
    open(2);
    fireEvent.click(screen.getByTitle("Retour à l'annuaire"));
    expect(window.location.pathname).toBe('/annuaire');
    expect(screen.getByText('Annuaire des Collaborateurs')).toBeInTheDocument();
  });

  it('« suivant » / « précédent » passent au voisin en conservant l\'onglet', () => {
    open(2, 'wishlist');
    fireEvent.click(screen.getByTitle('Collaborateur suivant'));
    expect(window.location.pathname).toBe(`/annuaire/${uuidOf(3)}/wishlist`);
    fireEvent.click(screen.getByTitle('Collaborateur précédent'));
    expect(window.location.pathname).toBe(`/annuaire/${uuidOf(2)}/wishlist`);
  });

  it('« précédent » désactivé sur le premier, « suivant » désactivé sur le dernier', () => {
    open(0);
    expect(screen.getByTitle('Collaborateur précédent')).toBeDisabled();
    expect(screen.getByTitle('Collaborateur suivant')).toBeEnabled();
    cleanup();
    open(DIRECTORY_EMPLOYEES.length - 1);
    expect(screen.getByTitle('Collaborateur suivant')).toBeDisabled();
    expect(screen.getByTitle('Collaborateur précédent')).toBeEnabled();
  });

  it.each([
    ['Purchase History', 'purchase-history'],
    ['Wishlist', 'wishlist'],
    ['Loyalty Program', 'loyalty'],
    ['Support Ticket', 'support'],
    ['Insight', 'insight'],
    ['Activity', 'activity'],
    ['Review', 'review'],
  ])('l\'onglet « %s » met l\'URL à jour', (label, key) => {
    open(1, key === 'review' ? 'wishlist' : 'review');
    fireEvent.click(screen.getByRole('button', { name: new RegExp(`^${label}`) }));
    expect(window.location.pathname).toBe(`/annuaire/${uuidOf(1)}/${key}`);
  });

  it('« Envoyer un message » déclenche le toast du framework avec le bon nom', () => {
    open(4);
    fireEvent.click(screen.getByRole('button', { name: /message/i }));
    expect(showToast).toHaveBeenCalledWith({
      description: `Messagerie directe ouverte avec ${DIRECTORY_EMPLOYEES[4].fullName}`,
      kind: 'success',
    });
  });

  it('« Options supplémentaires » déclenche un toast d\'information', () => {
    open(4);
    fireEvent.click(screen.getByTitle('Options supplémentaires'));
    expect(showToast).toHaveBeenCalledWith(expect.objectContaining({ kind: 'info' }));
  });

  it("changer de collaborateur change aussi la photo de couverture", async () => {
    open(2);
    fireEvent.click(screen.getByTitle('Collaborateur suivant'));
    await waitFor(() =>
      expect(shellBg.querySelector(`img[alt="Photo de couverture de ${DIRECTORY_EMPLOYEES[3].fullName}"]`)).not.toBeNull(),
    );
  });
});
