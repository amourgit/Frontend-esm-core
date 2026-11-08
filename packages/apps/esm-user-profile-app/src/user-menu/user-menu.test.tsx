import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ExtensionSlot, useAssignedExtensions, useSession } from '@egen-civitas/esm-framework';
import UserMenu from './user-menu.component';

const mockUseSession = vi.mocked(useSession);
const mockUseAssignedExtensions = vi.mocked(useAssignedExtensions);

const ext = (id: string) => ({ id, name: id, moduleName: '@egen/esm-x-app', meta: {} }) as never;

function withPanelItems() {
  mockUseAssignedExtensions.mockImplementation(((slot: string) =>
    slot === 'user-panel-slot' ? [ext('default-user-panel')] : [ext('logout-button')]) as never);
}

describe('UserMenu', () => {
  beforeEach(() => {
    mockUseSession.mockReturnValue({
      authenticated: true,
      user: { display: 'awa', username: 'awa.ndong', systemId: 'EG-0042', person: { display: 'Awa Ndong' } },
    } as never);
    withPanelItems();
  });

  it("n'affiche rien quand aucune app n'alimente le panneau", () => {
    mockUseAssignedExtensions.mockReturnValue([]);
    const { container } = render(<UserMenu />);

    expect(container).toBeEmptyDOMElement();
  });

  it("affiche l'avatar : initiale du nom, libellé et infobulle du compte", () => {
    render(<UserMenu />);

    const button = screen.getByRole('button', { name: /Mon compte/i });
    expect(button).toHaveTextContent('A');
    expect(button).toHaveAttribute('title', 'Awa Ndong');
    expect(button).toHaveAttribute('aria-haspopup', 'menu');
    expect(button).toHaveAttribute('aria-expanded', 'false');
  });

  it("sans nom, l'initiale est « ? »", () => {
    mockUseSession.mockReturnValue({ authenticated: true, user: {} } as never);
    render(<UserMenu />);

    expect(screen.getByRole('button')).toHaveTextContent('?');
  });

  describe("piloté par la TopBar (ouverture exclusive des panneaux)", () => {
    it("lit son état d'ouverture et le bascule via la TopBar, sous l'identifiant « userMenu »", async () => {
      const togglePanel = vi.fn();
      const isActivePanel = vi.fn(() => false);
      render(<UserMenu isActivePanel={isActivePanel} togglePanel={togglePanel} />);

      await userEvent.click(screen.getByRole('button'));

      expect(isActivePanel).toHaveBeenCalledWith('userMenu');
      expect(togglePanel).toHaveBeenCalledWith('userMenu');
      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    });

    it("affiche le panneau quand la TopBar le déclare actif : identité + slots du panneau", () => {
      render(<UserMenu isActivePanel={(id) => id === 'userMenu'} togglePanel={vi.fn()} />);

      expect(screen.getByRole('button')).toHaveAttribute('aria-expanded', 'true');
      expect(screen.getByRole('menu', { name: 'Menu utilisateur' })).toBeInTheDocument();
      expect(screen.getByText('Awa Ndong')).toBeInTheDocument();
      expect(screen.getByText('EG-0042')).toBeInTheDocument();
      const slots = vi.mocked(ExtensionSlot).mock.calls.map(([props]) => (props as { name: string }).name);
      expect(slots).toEqual(['user-panel-slot', 'user-panel-bottom-slot']);
    });

    it("se masque quand la recherche est ouverte sur un écran tactile (la place revient à la recherche)", () => {
      const { container } = render(<UserMenu searchOpen isDesktop={false} />);
      expect(container).toBeEmptyDOMElement();
    });

    it('reste affiché quand la recherche est ouverte sur un grand écran', () => {
      render(<UserMenu searchOpen isDesktop />);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });
  });

  it("monté hors d'une TopBar (aucune prop), gère lui-même son ouverture", async () => {
    render(<UserMenu />);
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button'));
    expect(screen.getByRole('menu')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button'));
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });
});
