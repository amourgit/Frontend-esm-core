import React from 'react';
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import Root from './root.component';
import { isUnknownRoute } from './is-unknown-route';

vi.mock('./not-found/not-found-page.component', () => ({
  default: () => <div data-testid="not-found-page" />,
}));
vi.mock('./is-unknown-route', () => ({ isUnknownRoute: vi.fn() }));

const unknown = vi.mocked(isUnknownRoute);
const routingEvent = () => act(() => void window.dispatchEvent(new Event('single-spa:routing-event')));

describe('esm-not-found-app Root', () => {
  beforeEach(() => unknown.mockReturnValue(true));
  afterEach(() => {
    document.documentElement.removeAttribute('data-public-route');
  });

  it('route inconnue : affiche la 404 et marque la route comme publique (pas de TopBar)', () => {
    render(<Root />);
    expect(screen.getByTestId('not-found-page')).toBeInTheDocument();
    expect(document.documentElement).toHaveAttribute('data-public-route', 'true');
  });

  it('route connue (page interne OU externe) : ne rend RIEN et ne touche pas à la TopBar', () => {
    unknown.mockReturnValue(false);
    const { container } = render(<Root />);
    expect(container).toBeEmptyDOMElement();
    expect(screen.queryByTestId('not-found-page')).toBeNull();
    expect(document.documentElement).not.toHaveAttribute('data-public-route');
  });

  it('suit la navigation sans être remonté : 404 → page connue → 404', () => {
    render(<Root />);
    expect(screen.getByTestId('not-found-page')).toBeInTheDocument();

    unknown.mockReturnValue(false);
    routingEvent();
    expect(screen.queryByTestId('not-found-page')).toBeNull();
    expect(document.documentElement).not.toHaveAttribute('data-public-route');

    unknown.mockReturnValue(true);
    routingEvent();
    expect(screen.getByTestId('not-found-page')).toBeInTheDocument();
    expect(document.documentElement).toHaveAttribute('data-public-route', 'true');
  });

  it("retire l'attribut au démontage pour rendre la TopBar aux autres pages", () => {
    const { unmount } = render(<Root />);
    unmount();
    expect(document.documentElement).not.toHaveAttribute('data-public-route');
  });

  it("cesse d'écouter le routage au démontage", () => {
    const remove = vi.spyOn(window, 'removeEventListener');
    const { unmount } = render(<Root />);
    unmount();
    expect(remove).toHaveBeenCalledWith('single-spa:routing-event', expect.any(Function));
  });
});
