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

import SitesSectionExtension from './sites/sites-section.extension';

describe('Section d’accueil — esm-sites-app', () => {
  beforeEach(() => navigate.mockClear());

  it('rend « Nos sites » avec son récapitulatif', () => {
    render(<SitesSectionExtension />);
    expect(screen.getByRole('heading', { level: 2, name: 'Nos sites' })).toBeInTheDocument();
    expect(within(region('Nos sites')).getByText(/^6 sites · \d+ collaborateurs$/)).toBeInTheDocument();
  });

  it('ouvre le guide des sites depuis le pied', () => {
    render(<SitesSectionExtension />);
    fireEvent.click(within(region('Nos sites')).getByRole('button', { name: /guide des sites/i }));
    expect(navigate).toHaveBeenLastCalledWith('/sites');
  });
});
