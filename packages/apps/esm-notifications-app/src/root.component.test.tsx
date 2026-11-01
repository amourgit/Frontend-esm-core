import React from 'react';
import '@testing-library/jest-dom/vitest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';
import { setToolWindowBadge, useAssignedExtensions } from '@egen-civitas/esm-framework';
import { NOTIFICATIONS_TOOL_ID } from './constants';
import Root from './root.component';

vi.mock('@egen-civitas/esm-framework', () => ({
  setToolWindowBadge: vi.fn(),
  useAssignedExtensions: vi.fn(),
}));

describe('Root (outils globaux)', () => {
  beforeEach(() => {
    vi.mocked(useAssignedExtensions).mockReturnValue([]);
  });

  it('ne dessine rien dans la page', () => {
    const { container } = render(<Root />);
    expect(container).toBeEmptyDOMElement();
  });

  it('publie le nombre de notifications sur le bouton du rail', () => {
    vi.mocked(useAssignedExtensions).mockReturnValue([{}, {}, {}] as any);
    render(<Root />);
    expect(setToolWindowBadge).toHaveBeenLastCalledWith(NOTIFICATIONS_TOOL_ID, 3);
  });

  it('retire la pastille au démontage', () => {
    vi.mocked(useAssignedExtensions).mockReturnValue([{}] as any);
    const { unmount } = render(<Root />);
    unmount();
    expect(setToolWindowBadge).toHaveBeenLastCalledWith(NOTIFICATIONS_TOOL_ID, null);
  });
});
