import React from 'react';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';

const state = vi.hoisted(() => ({
  attached: {} as Record<string, string[]>,
  extensions: {} as Record<string, { moduleName: string; meta?: { global?: boolean } }>,
  active: new Set<string>(),
  claims: {} as Record<string, unknown>,
  internal: { slots: {} as Record<string, { attachedIds: string[] }>, extensions: {} as Record<string, unknown> },
  layoutStore: { __layout: true },
}));

vi.mock('@egen-civitas/esm-framework/src/internal', () => ({ getExtensionInternalStore: () => ({ __internal: true }) }));
vi.mock('@egen-civitas/esm-framework', () => ({
  getGlobalStore: () => state.layoutStore,
  useStore: (store: { __internal?: boolean }) => (store.__internal ? state.internal : { claims: state.claims }),
  ExtensionSlot: (props: { name: string; className?: string; select?: (e: unknown[]) => Array<{ id: string }> }) => {
    const all = (state.attached[props.name] ?? []).map((id) => ({ id, name: id, ...state.extensions[id] }));
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
vi.mock('../hooks/useActiveAppModules', () => ({ useActiveAppModules: () => state.active }));

import { TopBarLevels } from './TopBarLevels';
import { TopBarUiProvider, type TopBarUi } from './context';
import { registerTopBarItem } from './items';

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
const primaryClasses = { row: 'row', left: 'left', center: 'center', right: 'right' };

function attach(slot: string, id: string, moduleName: string, meta?: { global?: boolean }) {
  state.attached[slot] = [...(state.attached[slot] ?? []), id];
  state.extensions[id] = { moduleName, meta };
  state.internal.slots[slot] = { attachedIds: state.attached[slot] };
  state.internal.extensions[id] = { moduleName, meta };
}

const renderBar = (config?: { min: number; max: number; disabled: number[] }) =>
  render(
    <TopBarUiProvider value={ui}>
      <TopBarLevels config={config} primaryClasses={primaryClasses} />
    </TopBarUiProvider>,
  );

const levelsRendered = (container: HTMLElement) =>
  [...container.querySelectorAll('[data-level]')].map((n) => n.getAttribute('data-level'));

describe('TopBarLevels', () => {
  beforeEach(() => {
    state.attached = {};
    state.extensions = {};
    state.internal = { slots: {}, extensions: {} };
    state.active = new Set(['@egen/esm-annuaire-app']);
    state.claims = {};
  });

  it('rend 2 niveaux par défaut, chacun avec trois régions', () => {
    const { container } = renderBar({ min: 2, max: 8, disabled: [] });
    expect(levelsRendered(container)).toEqual(['1', '2']);
    expect(container.querySelectorAll('[data-slot^="topbar-l2-"]')).toHaveLength(3);
  });

  it('une extension au niveau 4 (app active) crée 4 niveaux', () => {
    attach('topbar-l4-right-slot', 'annuaire-filtre', '@egen/esm-annuaire-app');
    const { container } = renderBar({ min: 1, max: 8, disabled: [] });
    expect(levelsRendered(container)).toEqual(['1', '2', '3', '4']);
    expect(screen.getByTestId('topbar-l4-right-slot')).toHaveTextContent('annuaire-filtre');
  });

  it("une extension d'une app inactive ne crée pas de niveau ; une globale oui", () => {
    attach('topbar-l3-left-slot', 'autre', '@egen/esm-sites-app');
    attach('topbar-l5-left-slot', 'globale', '@egen/esm-sites-app', { global: true });
    const { container } = renderBar({ min: 1, max: 8, disabled: [] });
    expect(levelsRendered(container)).toEqual(['1', '2', '3', '4', '5']);
    expect(screen.getByTestId('topbar-l3-left-slot')).not.toHaveTextContent('autre');
    expect(screen.getByTestId('topbar-l5-left-slot')).toHaveTextContent('globale');
  });

  it('niveau 2 désactivé : son contenu (slot historique compris) s’affiche au niveau 1, même région', () => {
    attach('top-nav-level2-end-slot', 'assistant', '@egen/esm-ai-app', { global: true });
    const { container } = renderBar({ min: 1, max: 8, disabled: [2] });
    expect(levelsRendered(container)).toEqual(['1']);
    expect(container.querySelector('[data-slot="topbar-l1-right"] [data-testid="top-nav-level2-end-slot"]')).toHaveTextContent(
      'assistant',
    );
  });

  it('éléments : un élément du niveau 2 passe au niveau 1 quand le niveau 2 est absent', () => {
    registerTopBarItem({ id: 'nav-test', region: 'l2-center', component: () => <nav>navigation</nav> });
    const { container } = renderBar({ min: 1, max: 1, disabled: [] });
    expect(container.querySelector('[data-slot="topbar-l1-center"]')).toHaveTextContent('navigation');
  });

  it("une règle d'app active masque un élément ; celle d'une app inactive est ignorée", () => {
    registerTopBarItem({ id: 'cible', region: 'l1-right', component: () => <b>cible</b> });
    state.claims = { '@egen/esm-sites-app': { regions: { 'l1-right': { hide: ['cible'] } } } };
    const { unmount } = renderBar();
    expect(screen.getByText('cible')).toBeInTheDocument();
    unmount();

    state.claims = { '@egen/esm-annuaire-app': { regions: { 'l1-right': { hide: ['cible'] } } } };
    renderBar();
    expect(screen.queryByText('cible')).not.toBeInTheDocument();
  });

  it('`levels.min` d’une app active ajoute des niveaux', () => {
    state.claims = { '@egen/esm-annuaire-app': { levels: { min: 4 } } };
    const { container } = renderBar({ min: 1, max: 8, disabled: [] });
    expect(levelsRendered(container)).toEqual(['1', '2', '3', '4']);
  });
});
