import React from 'react';
import '@testing-library/jest-dom/vitest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { showModal } from '@egen-civitas/esm-framework';
import { toggleThemeMode } from '@egen-civitas/esm-theme';
import SettingsPanel from './settings-panel.component';
import AppearanceSection from './appearance-section.component';
import LanguageSection from './language-section.component';

vi.mock('@egen-civitas/esm-framework', () => ({
  ExtensionSlot: ({ name }: { name: string }) => <div data-testid={`slot-${name}`} />,
  showModal: vi.fn(() => vi.fn()),
  useSession: () => ({ locale: 'fr' }),
}));
vi.mock('@egen-civitas/esm-theme', () => ({
  getThemeState: () => ({ mode: 'dark' }),
  getThemeEngine: () => ({ subscribe: () => () => undefined }),
  toggleThemeMode: vi.fn(),
}));
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (_key: string, fallback: string) => fallback }),
}));

describe('Panneau Paramètres', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('héberge les sections injectées dans global-settings-slot', () => {
    render(<SettingsPanel />);
    expect(screen.getByTestId('slot-global-settings-slot')).toBeInTheDocument();
  });

  it('Apparence : bascule le thème seulement si le mode choisi diffère du mode courant', () => {
    render(<AppearanceSection />);
    fireEvent.click(screen.getByRole('button', { name: 'Sombre' }));
    expect(toggleThemeMode).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Clair' }));
    expect(toggleThemeMode).toHaveBeenCalledTimes(1);
  });

  it('Langue : ouvre la modale de changement de langue', () => {
    render(<LanguageSection />);
    expect(screen.getByText('FR')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Changer de langue/ }));
    expect(showModal).toHaveBeenCalledWith('change-language-modal', expect.objectContaining({ size: 'sm' }));
  });
});
