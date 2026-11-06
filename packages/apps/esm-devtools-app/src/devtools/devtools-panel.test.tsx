import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

const setToolWindowBadge = vi.hoisted(() => vi.fn());
vi.mock('@egen-civitas/esm-framework', () => ({ setToolWindowBadge }));
vi.mock('./import-map.component', () => ({
  default: ({ toggleOverridden }: { toggleOverridden: (o: boolean) => void }) => (
    <button onClick={() => toggleOverridden(true)}>Mock Import Map</button>
  ),
}));

import DevToolsPanel from './devtools-panel.component';

describe('DevToolsPanel', () => {
  it("affiche l'import map et publie la pastille quand une surcharge apparaît", () => {
    render(<DevToolsPanel />);
    fireEvent.click(screen.getByText('Mock Import Map'));
    expect(setToolWindowBadge).toHaveBeenCalledWith('devtools', '!');
  });
});
