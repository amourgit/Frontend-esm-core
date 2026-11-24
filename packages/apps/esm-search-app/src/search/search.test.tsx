import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { navigate, useConfig } from '@egen-civitas/esm-framework';

vi.mock('@egen-civitas/esm-framework', () => import('@egen-civitas/esm-framework/mock'));
import Search, { buildSearchUrl } from './search.component';

const mockNavigate = vi.mocked(navigate);

/** Le déclencheur du champ replié est le conteneur de l'input (qui, replié, ne reçoit pas les clics). */
const clickTrigger = () => fireEvent.click(screen.getByTestId('gooey-input-trigger'));

describe('Search', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useConfig).mockReturnValue({ search: { path: '${egenSpaBase}/search' } } as never);
    // interpolateUrl (réel) lit la base de l'app dans `window.getEgenSpaBase`.
    (window as unknown as { getEgenSpaBase: () => string }).getEgenSpaBase = () => '/egen/';
  });

  it("construit l'URL de recherche : chemin interpolé, requête encodée", () => {
    expect(buildSearchUrl('${egenSpaBase}/search', 'a b&c')).toBe('/egen/search?q=a%20b%26c');
  });

  it('ouvre le champ puis navigue vers `search.path?q=` à la soumission', async () => {
    const setSearchOpen = vi.fn();
    const closePanels = vi.fn();
    const { rerender } = render(<Search searchOpen={false} setSearchOpen={setSearchOpen} closePanels={closePanels} />);

    clickTrigger();
    expect(setSearchOpen).toHaveBeenCalledWith(true);
    expect(closePanels).toHaveBeenCalled();

    rerender(<Search searchOpen setSearchOpen={setSearchOpen} closePanels={closePanels} />);
    await userEvent.type(screen.getByRole('searchbox'), 'budget 2027{Enter}');

    expect(mockNavigate).toHaveBeenCalledWith({ to: '/egen/search?q=budget%202027' });
  });

  it("ignore une requête vide ou faite d'espaces", async () => {
    render(<Search searchOpen setSearchOpen={vi.fn()} />);
    await userEvent.type(screen.getByRole('searchbox'), '   {Enter}');
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('propose « Annuler » sous le desktop quand la recherche est ouverte, et la referme', async () => {
    const setSearchOpen = vi.fn();
    render(<Search searchOpen setSearchOpen={setSearchOpen} isDesktop={false} isMobile />);

    await userEvent.click(screen.getByRole('button', { name: /annuler/i }));

    expect(setSearchOpen).toHaveBeenCalledWith(false);
  });

  it('pas de bouton « Annuler » sur desktop', () => {
    render(<Search searchOpen setSearchOpen={vi.fn()} isDesktop />);
    expect(screen.queryByRole('button', { name: /annuler/i })).not.toBeInTheDocument();
  });

  it("fonctionne sans TopBar : l'état d'ouverture est local", async () => {
    render(<Search />);
    clickTrigger();
    expect(await screen.findByRole('searchbox')).toBeEnabled();
  });
});
