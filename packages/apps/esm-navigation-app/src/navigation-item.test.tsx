import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('@egen-civitas/esm-framework', () => import('@egen-civitas/esm-framework/mock'));
vi.mock('./components/shell/DropdownNavigation', () => ({
  DropdownNavigation: () => <div data-testid="dropdown" />,
}));
vi.mock('./components/navigation/BreadcrumbNav', () => ({
  BreadcrumbNav: () => <div data-testid="breadcrumb" />,
}));
vi.mock('./context/WorkspaceContext', () => ({
  WorkspaceProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useWorkspace: () => ({ currentWorkspace: { id: 'intranet', name: 'Intranet', navItems: [] }, workspaceId: 'intranet' }),
}));
import Navigation from './navigation-item.component';

describe('Navigation (extension de la TopBar)', () => {
  beforeEach(() => {
    (window as unknown as { getEgenSpaBase: () => string }).getEgenSpaBase = () => '/';
  });
  afterEach(() => window.history.pushState({}, '', '/'));

  it("sur l'accueil : menu déroulant, sans fil d'Ariane", () => {
    window.history.pushState({}, '', '/home');
    render(<Navigation />);
    expect(screen.getByTestId('dropdown')).toBeInTheDocument();
    expect(screen.queryByTestId('breadcrumb')).not.toBeInTheDocument();
  });

  it("ailleurs : fil d'Ariane, sans menu déroulant ni bouton de retour", () => {
    window.history.pushState({}, '', '/annuaire/contacts');
    render(<Navigation />);
    expect(screen.getByTestId('breadcrumb')).toBeInTheDocument();
    expect(screen.queryByTestId('dropdown')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /fil d'ariane/i })).not.toBeInTheDocument();
  });
});
