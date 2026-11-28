import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useSession } from '@egen-civitas/esm-framework';

vi.mock('@egen-civitas/esm-framework', () => import('@egen-civitas/esm-framework/mock'));
vi.mock('../change-language/change-language-card-modal.component', () => ({
  ChangeLanguageCardModal: ({ open }: { open: boolean }) => (
    <div data-testid="change-language-card-modal" data-open={open ? 'true' : 'false'} />
  ),
}));
import { FLAG_BY_LOCALE } from './locale-flags';
import LanguageSwitcher from './language-switcher.component';

const mockUseSession = vi.mocked(useSession);

describe('LanguageSwitcher', () => {
  it('affiche le drapeau de la locale de la session', () => {
    mockUseSession.mockReturnValue({ locale: 'fr' } as never);
    render(<LanguageSwitcher />);

    expect(screen.getByRole('button', { name: /langue/i })).toHaveTextContent(FLAG_BY_LOCALE.fr);
  });

  it("retombe sur l'anglais sans session, et n'affiche pas de drapeau pour une locale inconnue", () => {
    mockUseSession.mockReturnValue(null as never);
    const { unmount } = render(<LanguageSwitcher />);
    expect(screen.getByRole('button')).toHaveTextContent(FLAG_BY_LOCALE.en);
    unmount();

    mockUseSession.mockReturnValue({ locale: 'xx' } as never);
    render(<LanguageSwitcher />);
    expect(screen.getByRole('button')).toHaveTextContent('');
  });

  it('ouvre la fenêtre de changement de langue au clic', async () => {
    mockUseSession.mockReturnValue({ locale: 'fr' } as never);
    render(<LanguageSwitcher />);

    const modal = screen.getByTestId('change-language-card-modal');
    expect(modal).toHaveAttribute('data-open', 'false');

    await userEvent.click(screen.getByRole('button'));

    expect(modal).toHaveAttribute('data-open', 'true');
  });

  it("s'efface quand la recherche s'ouvre sur un écran tactile, pas sur un grand écran", () => {
    mockUseSession.mockReturnValue({ locale: 'fr' } as never);
    const { container, unmount } = render(<LanguageSwitcher searchOpen isDesktop={false} />);
    expect(container).toBeEmptyDOMElement();
    unmount();

    render(<LanguageSwitcher searchOpen isDesktop />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });
});
