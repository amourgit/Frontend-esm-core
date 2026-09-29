import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import Root from './root.component';

vi.mock('./not-found/not-found-page.component', () => ({
  default: () => <div data-testid="not-found-page" />,
}));

vi.mock('@egen-civitas/tailwind-preset/tailwind.tw.css', () => ({}));

describe('esm-not-found-app Root', () => {
  afterEach(() => {
    document.documentElement.removeAttribute('data-public-route');
  });

  it('marque la route comme publique (pas de TopBar) tant que la 404 est montée', () => {
    render(<Root />);
    expect(screen.getByTestId('not-found-page')).toBeInTheDocument();
    expect(document.documentElement).toHaveAttribute('data-public-route', 'true');
  });

  it("retire l'attribut au démontage pour rendre la TopBar aux autres pages", () => {
    const { unmount } = render(<Root />);
    unmount();
    expect(document.documentElement).not.toHaveAttribute('data-public-route');
  });
});
