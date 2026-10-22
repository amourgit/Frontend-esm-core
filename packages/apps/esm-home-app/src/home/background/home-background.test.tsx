import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

const declared: Array<{ customComponent?: React.ReactElement }> = [];

vi.mock('@egen-civitas/esm-framework', () => ({
  AnimatedHomeBackground: () => null,
  PageBackground: (props: { customComponent?: React.ReactElement }) => {
    declared.push(props);
    return null;
  },
}));

import { AnimatedHomeBackground } from '@egen-civitas/esm-framework';
import { HomeBackground } from './home-background.component';

describe('HomeBackground', () => {
  it("déclare le fond animé par défaut au lieu d'en rendre un localement", () => {
    declared.length = 0;
    const { container } = render(<HomeBackground />);

    expect(declared).toHaveLength(1);
    expect(declared[0].customComponent?.type).toBe(AnimatedHomeBackground);
    // Le rendu est assuré par l'hôte global du shell : rien dans le DOM de l'app.
    expect(container).toBeEmptyDOMElement();
  });

  it('garde une référence stable entre les rendus (pas de ré-enregistrement inutile)', () => {
    declared.length = 0;
    const { rerender } = render(<HomeBackground />);
    rerender(<HomeBackground />);

    expect(declared.length).toBeGreaterThanOrEqual(2);
    expect(declared[1].customComponent).toBe(declared[0].customComponent);
  });
});
