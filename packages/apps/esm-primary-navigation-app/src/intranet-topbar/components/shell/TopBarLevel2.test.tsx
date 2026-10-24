import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';

const state = vi.hoisted(() => ({
  assigned: [] as Array<{ id: string; moduleName: string }>,
  active: new Set<string>(),
  slotCalls: [] as Array<Record<string, unknown>>,
}));

vi.mock('@egen-civitas/esm-framework', () => ({
  useAssignedExtensions: () => state.assigned,
  // Rend les extensions retenues par `select` (comme le vrai ExtensionSlot) pour tester le filtrage.
  ExtensionSlot: (props: {
    name: string;
    className?: string;
    select?: (e: typeof state.assigned) => typeof state.assigned;
  }) => {
    state.slotCalls.push(props);
    const kept = props.select ? props.select(state.assigned) : [];
    return (
      <div data-testid={props.name} className={props.className}>
        {props.name === 'top-nav-app-slot' && kept.map((e) => <span key={e.id}>{e.id}</span>)}
      </div>
    );
  },
}));
vi.mock('../../hooks/useActiveAppModules', () => ({ useActiveAppModules: () => state.active }));
vi.mock('../navigation/BreadcrumbLevel2Nav', () => ({ BreadcrumbLevel2Nav: () => <nav>fil-d-ariane</nav> }));
vi.mock('./DropdownNavigation', () => ({ DropdownNavigation: () => <nav>menu-deroulant</nav> }));

import { TOP_NAV_APP_SLOT, TopBarLevel2 } from './TopBarLevel2';

const baseProps = {
  isHome: false,
  showFullNav: false,
  onShowFullNav: vi.fn(),
  onHideFullNav: vi.fn(),
  navItems: [],
  slotState: {},
};

describe('TopBarLevel2', () => {
  beforeEach(() => {
    state.assigned = [
      { id: 'home-app-toolbar', moduleName: '@egen/esm-home-app' },
      { id: 'annuaire-toolbar', moduleName: '@egen/esm-annuaire-app' },
    ];
    state.active = new Set(['@egen/esm-home-app']);
    state.slotCalls = [];
  });

  it("n'affiche que le contenu de barre d'outils de l'app active, avec un séparateur", () => {
    render(<TopBarLevel2 {...baseProps} />);

    const slot = screen.getByTestId(TOP_NAV_APP_SLOT);
    expect(slot).toHaveTextContent('home-app-toolbar');
    expect(slot).not.toHaveTextContent('annuaire-toolbar');
    expect(slot).not.toHaveClass('hidden');
    expect(screen.getByTestId('topbar-app-divider')).toBeInTheDocument();
  });

  it("masque la zone app (sans séparateur) quand l'app active n'a rien déclaré", () => {
    state.active = new Set(['@egen/esm-sites-app']);
    render(<TopBarLevel2 {...baseProps} />);

    expect(screen.getByTestId(TOP_NAV_APP_SLOT)).toHaveClass('hidden');
    expect(screen.queryByTestId('topbar-app-divider')).not.toBeInTheDocument();
  });

  it('conserve les options de navigation : fil d’Ariane hors accueil, menu déroulant sur l’accueil', () => {
    const { rerender } = render(<TopBarLevel2 {...baseProps} />);
    expect(screen.getByText('fil-d-ariane')).toBeInTheDocument();
    expect(screen.queryByText('menu-deroulant')).not.toBeInTheDocument();

    rerender(<TopBarLevel2 {...baseProps} isHome />);
    expect(screen.getByText('menu-deroulant')).toBeInTheDocument();
    expect(screen.queryByText('fil-d-ariane')).not.toBeInTheDocument();
  });

  it("conserve la zone de fin (assistant IA) et le bouton « Mode Fil d'ariane »", () => {
    const onHideFullNav = vi.fn();
    render(<TopBarLevel2 {...baseProps} showFullNav onHideFullNav={onHideFullNav} />);

    expect(screen.getByTestId('top-nav-level2-end-slot')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Mode Fil d'ariane/ }));
    expect(onHideFullNav).toHaveBeenCalledTimes(1);
  });
});
