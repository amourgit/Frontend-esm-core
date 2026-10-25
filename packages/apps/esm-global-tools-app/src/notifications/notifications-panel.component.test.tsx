import React from 'react';
import '@testing-library/jest-dom/vitest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { useAssignedExtensions } from '@egen-civitas/esm-framework';
import NotificationsPanel from './notifications-panel.component';

vi.mock('@egen-civitas/esm-framework', () => ({
  ExtensionSlot: ({ name }: { name: string }) => <div data-testid={`slot-${name}`} />,
  useAssignedExtensions: vi.fn(),
}));
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (_key: string, fallback: string) => fallback }),
}));

describe('NotificationsPanel', () => {
  beforeEach(() => {
    vi.mocked(useAssignedExtensions).mockReturnValue([]);
  });

  it('affiche le slot des notifications et un état vide explicite', () => {
    render(<NotificationsPanel />);
    expect(screen.getByTestId('slot-notifications-nav-menu-slot')).toBeInTheDocument();
    expect(screen.getByText('Aucune nouvelle notification')).toBeInTheDocument();
  });

  it("masque l'état vide dès qu'une app injecte une notification", () => {
    vi.mocked(useAssignedExtensions).mockReturnValue([{}] as any);
    render(<NotificationsPanel />);
    expect(screen.queryByText('Aucune nouvelle notification')).not.toBeInTheDocument();
  });
});
