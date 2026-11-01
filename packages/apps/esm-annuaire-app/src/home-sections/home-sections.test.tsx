import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

const navigate = vi.hoisted(() => vi.fn());
vi.mock('@egen-civitas/esm-framework', async () =>
  (await import('./test-framework-mock')).createFrameworkMock(navigate),
);

const region = (name: string) => screen.getByRole('region', { name });
const cards = (name: string) => within(region(name)).getAllByRole('article');

import DirectorySectionExtension from './directory/directory-section.extension';

describe('Section d’accueil — esm-annuaire-app', () => {
  beforeEach(() => navigate.mockClear());

  it('affiche le nombre de collaborateurs montrés sur le total', () => {
    render(<DirectorySectionExtension />);
    expect(within(region('Annuaire')).getByText('8 collaborateurs affichés sur 40')).toBeInTheDocument();
  });

  it('filtre par département puis revient à « Tous »', () => {
    render(<DirectorySectionExtension />);
    expect(cards('Annuaire')).toHaveLength(8);

    fireEvent.click(within(region('Annuaire')).getByRole('button', { name: 'DSI' }));
    expect(cards('Annuaire')).toHaveLength(3);

    fireEvent.click(within(region('Annuaire')).getByRole('button', { name: 'Tous' }));
    expect(cards('Annuaire')).toHaveLength(8);
  });

  it('ouvre l’annuaire depuis le pied', () => {
    render(<DirectorySectionExtension />);
    fireEvent.click(within(region('Annuaire')).getByRole('button', { name: /ouvrir l’annuaire/i }));
    expect(navigate).toHaveBeenLastCalledWith('/annuaire');
  });

  it('ne fait pas déclencher la sélection d’un collaborateur par ses liens de contact', () => {
    render(<DirectorySectionExtension />);
    const mail = within(cards('Annuaire')[0]).getByRole('link', { name: /^Écrire à / });
    expect(mail).toHaveAttribute('href', expect.stringMatching(/^mailto:/));

    mail.addEventListener('click', (e) => e.preventDefault());
    fireEvent.click(mail);
    expect(navigate).not.toHaveBeenCalled();
  });
});
