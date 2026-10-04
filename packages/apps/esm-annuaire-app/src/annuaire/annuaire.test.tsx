/* eslint-disable testing-library/no-node-access, testing-library/no-container, testing-library/no-manual-cleanup, testing-library/no-render-in-lifecycle, jest-dom/prefer-in-document --
   Ces tests vérifient la structure rendue (régions ARIA de la galerie, lignes de tableau, images de fond) :
   il n'existe pas de requête Testing Library équivalente. */
import React from 'react';
import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
import { render, screen, cleanup, fireEvent, within, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { installBrowserStubs } from '../test-utils/setup';

vi.mock('@egen-civitas/esm-framework', async () => (await import('../test-utils/framework-mock')).frameworkMock());
vi.mock('@egen-civitas/tailwind-preset/tailwind.tw.css', () => ({}));

import Root from '../root.component';
import { DIRECTORY_EMPLOYEES, DIRECTORY_SITES, getEmployeeUuid } from '../data/directory-data';

const TOTAL = DIRECTORY_EMPLOYEES.length;
beforeAll(installBrowserStubs);
beforeEach(() => {
  cleanup();
  window.localStorage.clear();
  window.history.pushState({}, '', '/annuaire/contacts');
  render(<Root />);
});

const counter = () => screen.getByText(/^\d+ \/ \d+$/).textContent;
const searchInput = () => screen.getByPlaceholderText('Rechercher un collaborateur, un poste, un site, une compétence...') as HTMLInputElement;
const type = (v: string) => fireEvent.change(searchInput(), { target: { value: v } });

describe('annuaire — liste, recherche, filtres', () => {
  it('affiche tous les collaborateurs au départ', () => {
    expect(counter()).toBe(`${TOTAL} / ${TOTAL}`);
  });

  it('la recherche filtre sur le nom et le compteur suit', () => {
    const target = DIRECTORY_EMPLOYEES[0];
    type(target.lastName);
    const expected = DIRECTORY_EMPLOYEES.filter((e) => e.fullName.toLowerCase().includes(target.lastName.toLowerCase())).length;
    expect(expected).toBeGreaterThan(0);
    expect(counter()).toBe(`${expected} / ${TOTAL}`);
    expect(screen.getAllByText(target.fullName).length).toBeGreaterThan(0);
  });

  it('la recherche ignore la casse', () => {
    type(DIRECTORY_EMPLOYEES[0].lastName.toUpperCase());
    expect(counter()).not.toBe(`${TOTAL} / ${TOTAL}`);
    expect(counter()).not.toMatch(/^0 /);
  });

  it('une recherche sans résultat affiche l\'état vide et 0 résultat', async () => {
    type('zzzz-introuvable-xyz');
    expect(counter()).toBe(`0 / ${TOTAL}`);
    expect(await screen.findByText('Aucun collaborateur ne correspond à ces critères', {}, { timeout: 5000 })).toBeInTheDocument();
    expect(screen.queryByTitle('Afficher la vCard & QR Code')).toBeNull();
  });

  it("le bouton de l'état vide réinitialise les filtres", async () => {
    type('zzzz-introuvable-xyz');
    await screen.findByText('Aucun collaborateur ne correspond à ces critères', {}, { timeout: 5000 });
    fireEvent.click(screen.getByRole('button', { name: 'Réinitialiser les filtres' }));
    expect(counter()).toBe(`${TOTAL} / ${TOTAL}`);
  });

  it('« Effacer la recherche » vide le champ et restaure la liste', () => {
    type('zzzz-introuvable-xyz');
    fireEvent.click(screen.getByLabelText('Effacer la recherche'));
    expect(searchInput().value).toBe('');
    expect(counter()).toBe(`${TOTAL} / ${TOTAL}`);
  });

  it('« Effacer tous les filtres » restaure tout après recherche + site', () => {
    type(DIRECTORY_EMPLOYEES[0].lastName);
    fireEvent.click(screen.getByLabelText('Effacer tous les filtres'));
    expect(searchInput().value).toBe('');
    expect(counter()).toBe(`${TOTAL} / ${TOTAL}`);
  });

  it('la pilule d\'un site filtre sur ce site, « Tous les sites » restaure', () => {
    const site = DIRECTORY_SITES[0];
    fireEvent.click(screen.getByRole('button', { name: new RegExp(site.name.slice(0, 12)) }));
    const n = Number(counter()!.split(' / ')[0]);
    expect(n).toBeGreaterThan(0);
    expect(n).toBeLessThan(TOTAL);
    fireEvent.click(screen.getByRole('button', { name: new RegExp(`Tous les sites \\(${TOTAL}\\)`) }));
    expect(counter()).toBe(`${TOTAL} / ${TOTAL}`);
  });

  it('le filtre alphabétique ne garde que les initiales choisies, « All » restaure', () => {
    const alphabet = screen.getByLabelText('Filtre alphabétique vertical');
    const letter = DIRECTORY_EMPLOYEES[0].lastName[0].toUpperCase();
    fireEvent.click(within(alphabet).getByRole('button', { name: new RegExp(`^${letter}$`) }));
    const expected = DIRECTORY_EMPLOYEES.filter(
      (e) => e.lastName[0].toUpperCase() === letter || e.firstName[0].toUpperCase() === letter,
    ).length;
    expect(counter()).toBe(`${expected} / ${TOTAL}`);
    fireEvent.click(within(alphabet).getByRole('button', { name: /^Tous$/ }));
    expect(counter()).toBe(`${TOTAL} / ${TOTAL}`);
  });

  it('le filtre alphabétique expose bien les 26 lettres + All', () => {
    const alphabet = screen.getByLabelText('Filtre alphabétique vertical');
    expect(within(alphabet).getAllByRole('button')).toHaveLength(27);
  });
});

describe('annuaire — modes d\'affichage, onglets, ouverture des fiches', () => {
  it('mode Liste : un tableau avec une ligne par collaborateur', async () => {
    fireEvent.click(screen.getByLabelText('Affichage en Liste'));
    expect(screen.getByLabelText('Affichage en Liste')).toHaveAttribute('aria-pressed', 'true');
    await waitFor(() => expect(document.querySelectorAll('table tbody tr')).toHaveLength(TOTAL));
    expect(document.querySelectorAll('[title="Afficher la vCard & QR Code"]')).toHaveLength(0);
  });

  it('mode Galerie : un panneau dépliable par collaborateur, fermé au départ', async () => {
    fireEvent.click(screen.getByLabelText('Affichage Dépliable (Galerie)'));
    expect(screen.getByLabelText('Affichage Dépliable (Galerie)')).toHaveAttribute('aria-pressed', 'true');
    await waitFor(() => expect(document.querySelectorAll('[role="region"][aria-labelledby]')).toHaveLength(TOTAL));
    const headers = Array.from(document.querySelectorAll('[role="region"][aria-labelledby]')).map((r) => document.getElementById(r.getAttribute('aria-labelledby')!)!);
    expect(headers.every((h) => h.getAttribute('aria-expanded') === 'false')).toBe(true);
  });

  it('mode Grille (défaut) : une carte par collaborateur, et retour depuis la Liste', async () => {
    expect(document.querySelectorAll('[title="Afficher la vCard & QR Code"]')).toHaveLength(TOTAL);
    fireEvent.click(screen.getByLabelText('Affichage en Liste'));
    await waitFor(() => expect(document.querySelectorAll('table tbody tr')).toHaveLength(TOTAL));
    fireEvent.click(screen.getByLabelText('Affichage en Grille de cartes'));
    await waitFor(() => expect(document.querySelectorAll('[title="Afficher la vCard & QR Code"]')).toHaveLength(TOTAL));
  });

  it('cliquer l\'onglet Organigramme met à jour l\'URL et l\'onglet actif', () => {
    fireEvent.mouseDown(screen.getByRole('tab', { name: /Organigramme/i }));
    fireEvent.click(screen.getByRole('tab', { name: /Organigramme/i }));
    expect(window.location.pathname).toBe('/annuaire/organigramme');
    expect(screen.getByRole('tab', { name: /Organigramme/i })).toHaveAttribute('aria-selected', 'true');
  });

  it('cliquer l\'onglet À propos met à jour l\'URL', () => {
    const tab = screen.getByRole('tab', { name: /propos/i });
    fireEvent.mouseDown(tab);
    fireEvent.click(tab);
    expect(window.location.pathname).toBe('/annuaire/structures');
  });

  it('cliquer une carte ouvre l\'aperçu du collaborateur (modal)', () => {
    const emp = DIRECTORY_EMPLOYEES[0];
    fireEvent.click(screen.getAllByText(emp.fullName)[0]);
    expect(screen.getAllByText(emp.email).length).toBeGreaterThan(0);
  });

  it('le bouton « Fiche profil » de la galerie navigue vers la fiche du collaborateur', async () => {
    fireEvent.click(screen.getByLabelText('Affichage Dépliable (Galerie)'));
    await waitFor(() => expect(document.querySelectorAll('[role="region"][aria-labelledby]')).toHaveLength(TOTAL));
    const panel = document.querySelectorAll('[role="region"][aria-labelledby]')[0] as HTMLElement;
    const header = document.getElementById(panel.getAttribute('aria-labelledby')!)!;
    expect(panel).toHaveTextContent(DIRECTORY_EMPLOYEES[0].email);
    fireEvent.click(header);
    expect(header).toHaveAttribute('aria-expanded', 'true');
    fireEvent.click(within(panel).getByText('Fiche profil'));
    expect(window.location.pathname).toBe(`/annuaire/${getEmployeeUuid(DIRECTORY_EMPLOYEES[0])}/review`);
  });
});
