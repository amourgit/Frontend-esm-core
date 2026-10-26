import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

// Stubs minimaux du squelette `Section` du framework : on teste ICI l'assemblage de
// la page (sections, filtres, navigation), pas le rendu du squelette (testé dans
// esm-styleguide).
vi.mock('@egen-civitas/esm-framework', async () => {
  const { createElement: h } = await import('react');
  type Node = React.ReactNode;
  const Section = ({ title, actions, footer, footerActions, children }: Record<string, Node>) =>
    h(
      'section',
      { 'aria-label': typeof title === 'string' ? title : undefined },
      h('header', null, title ? h('h2', null, title) : null, actions),
      h('div', null, children),
      footer || footerActions ? h('footer', null, footer, footerActions) : null,
    );
  const SectionAction = ({
    children,
    label,
    active,
    disabled,
    onClick,
  }: {
    children?: Node;
    label?: string;
    active?: boolean;
    disabled?: boolean;
    onClick?: () => void;
  }) =>
    h(
      'button',
      { type: 'button', 'aria-label': children ? undefined : label, 'aria-pressed': active || undefined, disabled, onClick },
      children,
    );
  const SectionGrid = ({ children }: { children?: Node }) => h('div', null, children);
  return {
    Section,
    SectionAction,
    SectionGrid,
    showToast: () => undefined,
    CardModal: () => null,
    PageBackground: () => null,
    AnimatedHomeBackground: () => null,
  };
});

const navigate = vi.hoisted(() => vi.fn());
vi.mock('react-router-dom', async (importOriginal) => ({
  ...(await importOriginal<typeof import('react-router-dom')>()),
  useNavigate: () => navigate,
}));

import { MemoryRouter } from 'react-router-dom';
import { HomePage } from './home.component';

const renderHome = () =>
  render(
    <MemoryRouter>
      <HomePage />
    </MemoryRouter>,
  );

const region = (name: string) => screen.getByRole('region', { name });
const cards = (name: string) => within(region(name)).getAllByRole('article');

describe('HomePage', () => {
  beforeEach(() => {
    navigate.mockClear();
  });

  it('rend toutes les sections de l’accueil', () => {
    renderHome();
    for (const title of [
      'À la une',
      'Actualités',
      'Annonces',
      'Événements à venir',
      'Annuaire',
      'Nos sites',
    ]) {
      expect(screen.getByRole('heading', { level: 2, name: title })).toBeInTheDocument();
    }
  });

  it('affiche dans chaque pied le nombre d’éléments montrés sur le total', () => {
    renderHome();
    expect(within(region('Actualités')).getByText('6 articles affichés sur 8')).toBeInTheDocument();
    expect(within(region('Annonces')).getByText('6 annonces affichées sur 6')).toBeInTheDocument();
    expect(within(region('Événements à venir')).getByText('6 événements affichés sur 6')).toBeInTheDocument();
    expect(within(region('Annuaire')).getByText('8 collaborateurs affichés sur 40')).toBeInTheDocument();
    expect(within(region('Nos sites')).getByText(/^6 sites · \d+ collaborateurs$/)).toBeInTheDocument();
  });

  it('filtre les annonces par niveau depuis l’en-tête', () => {
    renderHome();
    expect(cards('Annonces')).toHaveLength(6);

    fireEvent.click(within(region('Annonces')).getByRole('button', { name: 'Alertes' }));
    expect(cards('Annonces')).toHaveLength(2);
    expect(within(region('Annonces')).getByText('2 annonces affichées sur 2')).toBeInTheDocument();
    expect(within(region('Annonces')).getByRole('button', { name: 'Alertes' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('filtre l’annuaire par département puis revient à « Tous »', () => {
    renderHome();
    expect(cards('Annuaire')).toHaveLength(8);

    fireEvent.click(within(region('Annuaire')).getByRole('button', { name: 'DSI' }));
    expect(cards('Annuaire')).toHaveLength(3);

    fireEvent.click(within(region('Annuaire')).getByRole('button', { name: 'Tous' }));
    expect(cards('Annuaire')).toHaveLength(8);
  });

  it('répartit les événements entre présentiel et en ligne sans en perdre', () => {
    renderHome();
    const section = region('Événements à venir');
    const total = cards('Événements à venir').length;

    fireEvent.click(within(section).getByRole('button', { name: 'En ligne' }));
    const online = cards('Événements à venir').length;
    fireEvent.click(within(section).getByRole('button', { name: 'Présentiel' }));
    const onsite = cards('Événements à venir').length;

    expect(online).toBeGreaterThan(0);
    expect(onsite).toBeGreaterThan(0);
    expect(online + onsite).toBe(total);
  });

  it('ouvre la bonne destination depuis une carte, un pied ou un contrôle', () => {
    renderHome();

    fireEvent.click(within(cards('Annonces')[0]).getByRole('button'));
    expect(navigate).toHaveBeenLastCalledWith(expect.stringMatching(/^\/informations\/annonces\?announcement=/));

    fireEvent.click(within(region('Événements à venir')).getByRole('button', { name: /agenda complet/i }));
    expect(navigate).toHaveBeenLastCalledWith('/informations/agenda');

    fireEvent.click(within(region('Annuaire')).getByRole('button', { name: /ouvrir l’annuaire/i }));
    expect(navigate).toHaveBeenLastCalledWith('/annuaire');

    fireEvent.click(within(region('Nos sites')).getByRole('button', { name: /guide des sites/i }));
    expect(navigate).toHaveBeenLastCalledWith('/sites');
  });

  it('ne fait pas déclencher la sélection d’un collaborateur par ses liens de contact', () => {
    renderHome();
    const first = cards('Annuaire')[0];
    const mail = within(first).getByRole('link', { name: /^Écrire à / });
    expect(mail.getAttribute('href')).toMatch(/^mailto:/);

    mail.addEventListener('click', (e) => e.preventDefault());
    fireEvent.click(mail);
    expect(navigate).not.toHaveBeenCalled();
  });
});
