import React from 'react';
import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { useRoutedPage } from './use-routed-page';

const Probe = () => <span data-testid="page">{useRoutedPage().id}</span>;
afterEach(() => {
  cleanup();
  window.history.pushState({}, '', '/');
});

describe('useRoutedPage', () => {
  it('suit les changements de route du shell et l’historique', () => {
    window.history.pushState({}, '', '/egen/theme-studio');
    render(<Probe />);
    expect(screen.getByTestId('page').textContent).toBe('essentials');
    act(() => {
      window.history.pushState({}, '', '/egen/theme-studio/couleurs');
      window.dispatchEvent(new Event('single-spa:routing-event'));
    });
    expect(screen.getByTestId('page').textContent).toBe('colors');
    act(() => {
      window.history.pushState({}, '', '/egen/theme-studio/composants');
      window.dispatchEvent(new PopStateEvent('popstate'));
    });
    expect(screen.getByTestId('page').textContent).toBe('components');
  });
});
