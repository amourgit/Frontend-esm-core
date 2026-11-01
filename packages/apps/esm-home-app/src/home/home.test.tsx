import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

const slots: Array<Record<string, unknown>> = [];

// L'assemblage des sections est testé dans les apps qui les fournissent ; ici on vérifie que la
// page expose bien le slot, avec le fond animé.
vi.mock('@egen-civitas/esm-framework', () => ({
  AnimatedHomeBackground: () => null,
  PageBackground: () => null,
  SectionSlot: (props: Record<string, unknown>) => {
    slots.push(props);
    return <div data-testid="section-slot" data-name={String(props.name)} />;
  },
}));

import { HomePage, HOME_SECTIONS_SLOT } from './home.component';

describe('HomePage', () => {
  it('expose le slot `home-sections` où les apps branchent leurs sections', () => {
    render(<HomePage />);
    expect(screen.getByTestId('section-slot')).toHaveAttribute('data-name', HOME_SECTIONS_SLOT);
    expect(HOME_SECTIONS_SLOT).toBe('home-sections');
  });

  it('ne rend plus aucune section en dur', () => {
    render(<HomePage />);
    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
  });
});
