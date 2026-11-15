import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useAssignedExtensions, useConfig } from '@egen-civitas/esm-framework';

vi.mock('@egen-civitas/esm-framework', () => import('@egen-civitas/esm-framework/mock'));
import Launcher from './launcher.component';
import Divider from './divider.component';

const mockExtensions = vi.mocked(useAssignedExtensions);
const mockConfig = vi.mocked(useConfig);
const ext = (id: string) => ({ id, name: id, moduleName: '@egen/esm-x-app', meta: {} }) as never;

describe('Launcher', () => {
  beforeEach(() => {
    mockExtensions.mockReturnValue([ext('a'), ext('b')]);
    mockConfig.mockReturnValue({ externalRefLinks: [] } as never);
  });

  it("n'affiche rien sans tuile ni lien externe", () => {
    mockExtensions.mockReturnValue([]);
    const { container } = render(<Launcher />);
    expect(container).toBeEmptyDOMElement();
  });

  it('le badge compte les tuiles des apps et les liens externes, plafonné à 9+', () => {
    mockConfig.mockReturnValue({ externalRefLinks: [{ title: 'Docs', redirect: 'https://x.test' }] } as never);
    const { unmount } = render(<Launcher />);
    expect(screen.getByRole('button', { name: /applications/i })).toHaveTextContent('3');
    unmount();

    mockExtensions.mockReturnValue(Array.from({ length: 10 }, (_, i) => ext(`e${i}`)));
    render(<Launcher />);
    expect(screen.getByRole('button', { name: /applications/i })).toHaveTextContent('9+');
  });

  it("sans TopBar, ouvre et ferme le panneau lui-même ; les liens externes s'ouvrent dans un nouvel onglet", async () => {
    mockConfig.mockReturnValue({ externalRefLinks: [{ title: 'Docs', redirect: 'https://x.test' }] } as never);
    render(<Launcher />);
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /applications/i }));
    expect(screen.getByRole('menu')).toBeInTheDocument();
    const link = screen.getByRole('link', { name: /docs/i });
    expect(link).toHaveAttribute('href', 'https://x.test');
    expect(link).toHaveAttribute('target', '_blank');

    await userEvent.click(screen.getByRole('button', { name: /applications/i }));
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it("avec la TopBar : l'ouverture est pilotée par `isActivePanel` / `togglePanel` (panneau « appMenu »)", async () => {
    const togglePanel = vi.fn();
    const { rerender } = render(<Launcher isActivePanel={() => false} togglePanel={togglePanel} />);
    await userEvent.click(screen.getByRole('button', { name: /applications/i }));
    expect(togglePanel).toHaveBeenCalledWith('appMenu');
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();

    rerender(<Launcher isActivePanel={(id) => id === 'appMenu'} togglePanel={togglePanel} />);
    expect(screen.getByRole('menu')).toBeInTheDocument();
  });

  it('cède la place à la recherche ouverte sur un écran tactile', () => {
    const { container } = render(<Launcher searchOpen isDesktop={false} />);
    expect(container).toBeEmptyDOMElement();
  });
});

describe('Divider', () => {
  it('est décoratif (aria-hidden)', () => {
    const { container } = render(<Divider />);
    expect(container).toContainHTML('aria-hidden="true"');
  });

  it('cède la place à la recherche ouverte sur un écran tactile', () => {
    const { container } = render(<Divider searchOpen isDesktop={false} />);
    expect(container).toBeEmptyDOMElement();
  });
});
