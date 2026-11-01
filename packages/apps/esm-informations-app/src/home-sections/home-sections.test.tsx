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

import HeroSectionExtension from './hero/hero-section.extension';
import NewsSectionExtension from './news/news-section.extension';
import AnnouncementsSectionExtension from './announcements/announcements-section.extension';
import EventsSectionExtension from './events/events-section.extension';

const renderAll = () =>
  render(
    <>
      <HeroSectionExtension />
      <NewsSectionExtension />
      <AnnouncementsSectionExtension />
      <EventsSectionExtension />
    </>,
  );

describe('Sections d’accueil — esm-informations-app', () => {
  beforeEach(() => navigate.mockClear());

  it('rend À la une, Actualités, Annonces et Événements à venir', () => {
    renderAll();
    for (const title of ['À la une', 'Actualités', 'Annonces', 'Événements à venir']) {
      expect(screen.getByRole('heading', { level: 2, name: title })).toBeInTheDocument();
    }
  });

  it('affiche dans chaque pied le nombre d’éléments montrés sur le total', () => {
    renderAll();
    expect(within(region('Actualités')).getByText('6 articles affichés sur 8')).toBeInTheDocument();
    expect(within(region('Annonces')).getByText('6 annonces affichées sur 6')).toBeInTheDocument();
    expect(within(region('Événements à venir')).getByText('6 événements affichés sur 6')).toBeInTheDocument();
  });

  it('filtre les annonces par niveau depuis l’en-tête', () => {
    renderAll();
    expect(cards('Annonces')).toHaveLength(6);

    fireEvent.click(within(region('Annonces')).getByRole('button', { name: 'Alertes' }));
    expect(cards('Annonces')).toHaveLength(2);
    expect(within(region('Annonces')).getByText('2 annonces affichées sur 2')).toBeInTheDocument();
    expect(within(region('Annonces')).getByRole('button', { name: 'Alertes' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('répartit les événements entre présentiel et en ligne sans en perdre', () => {
    renderAll();
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

  it('ouvre la bonne destination depuis une carte ou un pied', () => {
    renderAll();

    fireEvent.click(within(cards('Annonces')[0]).getByRole('button'));
    expect(navigate).toHaveBeenLastCalledWith(expect.stringMatching(/^\/informations\/annonces\?announcement=/));

    fireEvent.click(within(region('Événements à venir')).getByRole('button', { name: /agenda complet/i }));
    expect(navigate).toHaveBeenLastCalledWith('/informations/agenda');
  });
});
