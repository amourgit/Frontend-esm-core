import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { EgenLogo } from './EgenLogo';

describe('EgenLogo', () => {
  it('affiche par défaut le logo complet (logo + « EGEN » écrit)', () => {
    render(<EgenLogo />);

    const img = screen.getByRole('img', { name: /EGEN/i });
    expect(img).toHaveAttribute('src', expect.stringContaining('egen-logo-full'));
  });

  it('affiche le logo seul avec variant="icon"', () => {
    render(<EgenLogo variant="icon" />);

    const img = screen.getByRole('img', { name: /EGEN/i });
    expect(img).toHaveAttribute('src', expect.stringContaining('egen-logo-icon'));
  });

  it('ne déforme pas le logo : la hauteur vient du conteneur, la largeur reste automatique', () => {
    render(<EgenLogo size="xl" />);

    expect(screen.getByRole('img', { name: /EGEN/i })).toHaveClass('h-full', 'w-auto', 'object-contain');
  });
});
