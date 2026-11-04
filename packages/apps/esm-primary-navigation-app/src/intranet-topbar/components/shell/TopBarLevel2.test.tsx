import React from 'react';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';

const state = vi.hoisted(() => ({
  assigned: {} as Record<string, Array<{ id: string; name: string; moduleName: string; meta?: { global?: boolean } }>>,
  active: new Set<string>(),
  claims: {} as Record<string, unknown>,
}));

vi.mock('@egen-civitas/esm-framework', () => ({
  useAssignedExtensions: (slot: string) => state.assigned[slot] ?? [],
  getGlobalStore: () => ({ getState: () => ({ claims: state.claims }), setState: vi.fn(), subscribe: vi.fn() }),
  useStore: () => ({ claims: state.claims }),
  // Rend les extensions retenues par `select` (comme le vrai ExtensionSlot) pour tester le filtrage.
  ExtensionSlot: (props: {
    name: string;
    className?: string;
    select?: (e: Array<{ id: string; name: string; moduleName: string }>) => Array<{ id: string }>;
  }) => {
    const all = state.assigned[props.name] ?? [];
    const kept = props.select ? props.select(all) : all;
    return (
      <div data-testid={props.name} className={props.className}>
        {kept.map((e) => (
          <span key={e.id}>{e.id}</span>
        ))}
      </div>
    );
  },
}));
vi.mock('../../hooks/useActiveAppModules', () => ({ useActiveAppModules: () => state.active }));

import { TopBarUiProvider, registerTopBarItem, type TopBarUi } from '../../kit';
import { TopBarLevel2 } from './TopBarLevel2';

const ui: TopBarUi = {
  activeMenu: null,
  isActivePanel: () => false,
  togglePanel: vi.fn(),
  hidePanel: () => () => {},
  closePanels: vi.fn(),
  searchOpen: false,
  setSearchOpen: vi.fn(),
  isMobile: false,
  isDesktop: true,
};

const renderBar = () =>
  render(
    <TopBarUiProvider value={ui}>
      <TopBarLevel2 />
    </TopBarUiProvider>,
  );

describe('TopBarLevel2', () => {
  beforeEach(() => {
    state.assigned = {
      'top-nav-app-slot': [
        { id: 'home-app-toolbar', name: 'home-app-toolbar', moduleName: '@egen/esm-home-app' },
        { id: 'annuaire-toolbar', name: 'annuaire-toolbar', moduleName: '@egen/esm-annuaire-app' },
      ],
    };
    state.active = new Set(['@egen/esm-home-app']);
    state.claims = {};
    registerTopBarItem({ id: 'nav', region: 'l2-center', component: () => <nav>navigation</nav> });
  });

  it("n'affiche que le contenu de l'app active (slot historique), avec un séparateur", () => {
    renderBar();
    const slot = screen.getByTestId('top-nav-app-slot');
    expect(slot).toHaveTextContent('home-app-toolbar');
    expect(slot).not.toHaveTextContent('annuaire-toolbar');
    expect(screen.getByTestId('topbar-app-divider')).toBeInTheDocument();
  });

  it("sans contenu d'app : pas de séparateur", () => {
    state.active = new Set(['@egen/esm-sites-app']);
    renderBar();
    expect(screen.queryByTestId('topbar-app-divider')).not.toBeInTheDocument();
  });

  it('affiche les éléments de la région centrale et le slot de fin', () => {
    renderBar();
    expect(screen.getByText('navigation')).toBeInTheDocument();
    expect(screen.getByTestId('top-nav-level2-end-slot')).toBeInTheDocument();
  });

  it('une app peut masquer un élément de la région (layout) tant qu’elle est active', () => {
    state.claims = { '@egen/esm-home-app': { 'l2-center': { hide: ['nav'] } } };
    renderBar();
    expect(screen.queryByText('navigation')).not.toBeInTheDocument();
  });

  it('le layout d’une app inactive est ignoré', () => {
    state.claims = { '@egen/esm-annuaire-app': { 'l2-center': { hide: ['nav'] } } };
    renderBar();
    expect(screen.getByText('navigation')).toBeInTheDocument();
  });

  it('`only` limite la région aux éléments listés', () => {
    state.claims = { '@egen/esm-home-app': { 'l2-left': { only: ['autre'] } } };
    renderBar();
    expect(screen.getByTestId('top-nav-app-slot')).not.toHaveTextContent('home-app-toolbar');
    expect(screen.queryByTestId('topbar-app-divider')).not.toBeInTheDocument();
  });
});
