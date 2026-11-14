import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import routes from '../routes.json';
import Clock, { formatClock } from './clock.component';

describe('formatClock', () => {
  it("affiche l'heure sur 12 h (AM/PM) et la date longue en français, avec majuscule", () => {
    expect(formatClock(new Date(2026, 10, 9, 15, 5))).toEqual({ timeStr: '3:05 PM', dateLongStr: 'Lundi 9 novembre 2026' });
  });

  it('minuit et midi valent 12', () => {
    expect(formatClock(new Date(2026, 10, 9, 0, 0)).timeStr).toBe('12:00 AM');
    expect(formatClock(new Date(2026, 10, 9, 12, 30)).timeStr).toBe('12:30 PM');
  });
});

describe('<Clock />', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 10, 9, 9, 0));
  });
  afterEach(() => vi.useRealTimers());

  it("affiche l'heure et la date, et se met à jour toutes les 15 secondes", () => {
    render(<Clock />);
    expect(screen.getByText('9:00 AM')).toBeInTheDocument();
    expect(screen.getByText('Lundi 9 novembre 2026')).toBeInTheDocument();

    act(() => void vi.advanceTimersByTime(60_000));

    expect(screen.getByText('9:01 AM')).toBeInTheDocument();
  });

  it('cesse de se mettre à jour au démontage (pas de minuteur orphelin)', () => {
    const { unmount } = render(<Clock />);
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });
});

describe('routes.json', () => {
  it("l'horloge est une extension du slot neutre de la TopBar, à sa place historique", () => {
    expect(routes.extensions).toEqual([
      expect.objectContaining({ name: 'clock', slot: 'topbar-slot', meta: { global: true, topbar: { level: 'main', rank: 10, region: 'right', order: 100 } } }),
    ]);
  });
});
