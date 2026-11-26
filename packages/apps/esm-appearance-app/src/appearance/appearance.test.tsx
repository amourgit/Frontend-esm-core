import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { getTheme, getThemeMode, toggleThemeMode } from '@egen-civitas/esm-theme';
import FullscreenToggle from './fullscreen-toggle.component';
import ThemeToggle from './theme-toggle.component';

vi.mock('@egen-civitas/esm-theme', () => ({
  getTheme: vi.fn(),
  getThemeMode: vi.fn(),
  toggleThemeMode: vi.fn(),
}));

describe('ThemeToggle', () => {
  beforeEach(() => {
    vi.mocked(getThemeMode).mockReturnValue('dark');
    vi.mocked(getTheme).mockReturnValue({ subscribe: vi.fn(() => () => {}) } as never);
  });

  it('propose de passer en mode clair quand le thème est sombre, et bascule au clic', async () => {
    render(<ThemeToggle />);

    await userEvent.click(screen.getByRole('button', { name: /mode clair/i }));

    expect(toggleThemeMode).toHaveBeenCalledTimes(1);
  });

  it('suit le runtime de thème : le libellé change quand le mode change', () => {
    let listener: (event: { type: string; mode?: string }) => void = () => {};
    vi.mocked(getTheme).mockReturnValue({
      subscribe: vi.fn((fn) => {
        listener = fn;
        return () => {};
      }),
    } as never);
    render(<ThemeToggle />);
    expect(screen.getByRole('button', { name: /mode clair/i })).toBeInTheDocument();

    act(() => listener({ type: 'mode', mode: 'light' }));

    expect(screen.getByRole('button', { name: /mode sombre/i })).toBeInTheDocument();
  });

  it("démarre en mode sombre quand le thème n'est pas initialisé, sans planter", () => {
    vi.mocked(getThemeMode).mockReturnValue(null);
    vi.mocked(getTheme).mockImplementation(() => {
      throw new Error('thème non initialisé');
    });
    render(<ThemeToggle />);

    expect(screen.getByRole('button', { name: /mode clair/i })).toBeInTheDocument();
  });

  it("s'efface sous le desktop, où la place revient à la recherche", () => {
    const { container } = render(<ThemeToggle isDesktop={false} />);
    expect(container).toBeEmptyDOMElement();
  });
});

describe('FullscreenToggle', () => {
  beforeEach(() => {
    Object.defineProperty(document, 'fullscreenElement', { configurable: true, value: null });
    document.documentElement.requestFullscreen = vi.fn().mockResolvedValue(undefined);
    document.exitFullscreen = vi.fn().mockResolvedValue(undefined);
  });

  it("entre en plein écran au clic quand on n'y est pas", async () => {
    render(<FullscreenToggle />);

    await userEvent.click(screen.getByRole('button', { name: /plein écran/i }));

    expect(document.documentElement.requestFullscreen).toHaveBeenCalledTimes(1);
  });

  it('quitte le plein écran au clic, et le libellé suit l’état réel du navigateur', async () => {
    render(<FullscreenToggle />);

    Object.defineProperty(document, 'fullscreenElement', { configurable: true, value: document.documentElement });
    act(() => void document.dispatchEvent(new Event('fullscreenchange')));
    await userEvent.click(screen.getByRole('button', { name: /quitter le plein écran/i }));

    expect(document.exitFullscreen).toHaveBeenCalledTimes(1);
  });

  it("s'efface sous le desktop", () => {
    const { container } = render(<FullscreenToggle isDesktop={false} />);
    expect(container).toBeEmptyDOMElement();
  });
});
