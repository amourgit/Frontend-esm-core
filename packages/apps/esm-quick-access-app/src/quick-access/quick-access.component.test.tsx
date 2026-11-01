import React from 'react';
import '@testing-library/jest-dom/vitest';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { navigate } from '@egen-civitas/esm-framework';
import QuickAccessPanel from './quick-access-panel.component';
import ShortcutsSection from './shortcuts-section.component';
import GlanceSection from './glance-section.component';

vi.mock('@egen-civitas/esm-framework', () => ({
  ExtensionSlot: ({ name }: { name: string }) => <div data-testid={`slot-${name}`} />,
  interpolateUrl: (url: string) => url.replace('${egenSpaBase}', '/spa'),
  navigate: vi.fn(),
  useConfig: () => ({ shortcuts: [{ id: 'home', label: 'Accueil', icon: 'House', to: '${egenSpaBase}/home' }] }),
}));
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (_key: string, fallback: string) => fallback, i18n: { language: 'fr' } }),
}));

describe('Panneau Accès rapide', () => {
  it('héberge les sections injectées dans quick-access-section-slot', () => {
    render(<QuickAccessPanel />);
    expect(screen.getByTestId('slot-quick-access-section-slot')).toBeInTheDocument();
  });

  it('Raccourcis : un clic navigue vers la cible configurée', () => {
    render(<ShortcutsSection />);
    fireEvent.click(screen.getByRole('button', { name: 'Accueil' }));
    expect(navigate).toHaveBeenCalledWith({ to: '/spa/home' });
  });

  it('Coup d’œil : affiche l’état de connexion', () => {
    render(<GlanceSection />);
    expect(screen.getByText(/en ligne|hors ligne/i)).toBeInTheDocument();
  });
});
