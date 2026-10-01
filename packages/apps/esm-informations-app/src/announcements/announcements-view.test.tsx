import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { AnnouncementsView } from './announcements-view.component';
import { ALL_ANNOUNCEMENTS } from './announcements-data';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (_key: string, fallback: string) => fallback }),
}));
vi.mock('@egen-civitas/esm-framework', () => ({ playXboxSound: vi.fn() }));

describe('AnnouncementsView', () => {
  it("affiche toutes les annonces quand l'audience est « all »", () => {
    render(<AnnouncementsView audience="all" />);
    expect(screen.getAllByRole('listitem')).toHaveLength(ALL_ANNOUNCEMENTS.length);
  });

  it('filtre par audience (extranet)', () => {
    render(<AnnouncementsView audience="extranet" />);
    const expected = ALL_ANNOUNCEMENTS.filter((a) => a.audience === 'extranet').length;
    expect(screen.getAllByRole('listitem')).toHaveLength(expected);
  });

  it('recherche dans le texte et affiche un message si rien ne correspond', () => {
    render(<AnnouncementsView />);
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'zzzz-introuvable' } });
    expect(screen.getByText('No announcements for this selection.')).toBeInTheDocument();
  });

  it("déplie le détail d'une annonce au clic", () => {
    render(<AnnouncementsView />);
    const first = screen.getAllByRole('button', { expanded: false })[0];
    fireEvent.click(first);
    expect(screen.getAllByRole('button', { expanded: true })).toHaveLength(1);
  });
});
