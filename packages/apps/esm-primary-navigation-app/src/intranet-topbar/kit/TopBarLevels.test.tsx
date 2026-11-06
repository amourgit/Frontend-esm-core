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
  transient: [] as unknown[],
}));

vi.mock('@egen-civitas/esm-framework/src/internal', () => ({
  getExtensionInternalStore: () => ({ getState: () => state.internal, subscribe: () => () => {} }),
}));
vi.mock('@egen-civitas/esm-framework', () => ({
  getGlobalStore: (name: string) => ({ __name: name }),
  useStore: (store: { __name?: string }) =>
    store.__name === 'egen-topbar-transient' ? { levels: state.transient } : { claims: state.claims },
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

import { COMPACT_SKIN, TopBarLevels } from './TopBarLevels';
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
const fullSkin = { row: 'row', left: 'left', center: 'center', right: 'right' };
const firstRowFull = ({ isFirst }: { isFirst: boolean }) => (isFirst ? fullSkin : COMPACT_SKIN);

function attach(slot: string, id: string, moduleName: string, meta?: { global?: boolean }) {
  state.attached[slot] = [...(state.attached[slot] ?? []), id];
  state.extensions[id] = { moduleName, meta };
  state.internal.slots[slot] = { attachedIds: state.attached[slot] };
  state.internal.extensions[id] = { moduleName, meta };
}

const renderBar = (config?: { min: number; max: number; disabled: number[] }) =>
  render(
    <TopBarUiProvider value={ui}>
      <TopBarLevels config={config} skinFor={firstRowFull} />
    </TopBarUiProvider>,
  );

const levelsRendered = (container: HTMLElement) =>
  Array.from(container.querySelectorAll('[data-level]')).map((n) => n.getAttribute('data-level'));

describe('TopBarLevels', () => {
  beforeEach(() => {
    state.attached = {};
    state.extensions = {};
    state.internal = { slots: {}, extensions: {} };
    state.active = new Set(['@egen/esm-annuaire-app']);
    state.claims = {};
    state.transient = [];
  });

  it('rend 2 niveaux par défaut, chacun avec trois régions', () => {
    const { container } = renderBar({ min: 2, max: 8, disabled: [] });
    expect(levelsRendered(container)).toEqual(['1', '2']);
    // trois régions de contenu + le calque d'arrière-plan
    for (const region of ['left', 'center', 'right', 'background']) {
      expect(container.querySelectorAll(`[data-slot="topbar-l2-${region}"]`)).toHaveLength(1);
    }
    expect(container.querySelectorAll('[data-slot^="topbar-l2-"]')).toHaveLength(4);
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
    expect(
      container.querySelector('[data-slot="topbar-l1-right"] [data-testid="top-nav-level2-end-slot"]'),
    ).toHaveTextContent('assistant');
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

  it('fond d’un niveau : transparent par défaut, surchargé par une app active', () => {
    const first = renderBar();
    expect(first.container.querySelector('[data-level="1"]')).not.toHaveAttribute('style');
    first.unmount();

    state.claims = { '@egen/esm-annuaire-app': { levels: { background: { 1: 'rgb(1, 2, 3)' } } } };
    const { container } = renderBar();
    expect(container.querySelector('[data-level="1"]')).toHaveStyle({ background: 'rgb(1, 2, 3)' });
    expect(container.querySelector('[data-level="2"]')).not.toHaveAttribute('style');
  });

  it('un slot d’arrière-plan de niveau accueille les extensions d’une app active', () => {
    attach('topbar-l2-background-slot', 'fond-anime', '@egen/esm-annuaire-app');
    renderBar();
    expect(screen.getByTestId('topbar-l2-background-slot')).toHaveTextContent('fond-anime');
  });

  it('un niveau éphémère se place après le dernier niveau numéroté', () => {
    attach('topbar-transient-slot', 'flash', '@egen/esm-annuaire-app');
    state.transient = [{ id: 't1', extension: 'flash', openedAt: 0, expiresAt: null, closing: false }];
    const { container } = renderBar({ min: 3, max: 8, disabled: [] });
    const last = container.querySelector('[data-level="3"]')!;
    const transient = container.querySelector('[data-transient="t1"]')!;
    expect(transient).toHaveTextContent('flash');
    expect(last.compareDocumentPosition(transient) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  describe('squelette uniforme', () => {
    /** Empreinte structurelle d'une rangée : ses enfants, avec le numéro de niveau retiré. */
    const skeleton = (row: Element, level: number) =>
      Array.from(row.children)
        .map((c) => c.getAttribute('data-slot') ?? c.tagName.toLowerCase())
        .map((x) => x.replace(`l${level}-`, 'lN-').replace(`-${level}`, '-N'))
        .join(' | ');

    it('toutes les rangées ont le même squelette : arrière-plan + gauche + centre + droite', () => {
      const { container } = renderBar({ min: 6, max: 8, disabled: [] });
      const rows = Array.from(container.querySelectorAll('[data-level]'));
      expect(rows).toHaveLength(6);
      const signatures = rows.slice(1).map((row, i) => skeleton(row, i + 2));
      // les rangées compactes sont strictement identiques entre elles
      expect(new Set(signatures).size).toBe(1);
      // et chaque rangée, la première comprise, expose les quatre régions
      rows.forEach((row, i) => {
        const level = i + 1;
        for (const region of ['background', 'left', 'center', 'right']) {
          expect(row.querySelector(`[data-slot="topbar-l${level}-${region}"]`)).not.toBeNull();
        }
      });
    });

    it('la peau dépend de la POSITION, pas du numéro : sans le niveau 2, le niveau 3 est une rangée compacte', () => {
      const seen: Array<{ level: number; index: number; isFirst: boolean; isLast: boolean }> = [];
      const spy = (pos: { level: number; index: number; isFirst: boolean; isLast: boolean }) => {
        seen.push({ level: pos.level, index: pos.index, isFirst: pos.isFirst, isLast: pos.isLast });
        return pos.isFirst ? fullSkin : COMPACT_SKIN;
      };
      const { container } = render(
        <TopBarUiProvider value={ui}>
          <TopBarLevels config={{ min: 3, max: 8, disabled: [2] }} skinFor={spy} />
        </TopBarUiProvider>,
      );
      expect(levelsRendered(container)).toEqual(['1', '3']);
      expect(seen).toContainEqual({ level: 1, index: 0, isFirst: true, isLast: false });
      expect(seen).toContainEqual({ level: 3, index: 1, isFirst: false, isLast: true });
      expect(container.querySelector('[data-level="1"]')).toHaveAttribute('data-level-first');
      expect(container.querySelector('[data-level="1"]')).not.toHaveAttribute('role');
      expect(container.querySelector('[data-level="3"]')).not.toHaveAttribute('data-level-first');
      expect(container.querySelector('[data-level="3"]')).toHaveAttribute('role', 'toolbar');
    });

    it('sans `skinFor`, tous les niveaux (le premier compris) reçoivent la peau compacte', () => {
      const { container } = render(
        <TopBarUiProvider value={ui}>
          <TopBarLevels config={{ min: 3, max: 8, disabled: [] }} />
        </TopBarUiProvider>,
      );
      container.querySelectorAll('[data-level]').forEach((row) => expect(row).toHaveAttribute('role', 'toolbar'));
    });

    it('un composant quelconque d’une app s’ajoute à n’importe quelle région de n’importe quel niveau', () => {
      for (const [region, level] of [
        ['l1-left', 1],
        ['l3-center', 3],
        ['l5-right', 5],
      ] as const) {
        registerTopBarItem({ id: `libre-${region}`, region, component: () => <i>{`contenu ${region}`}</i> });
        const { container, unmount } = renderBar({ min: 1, max: 8, disabled: [] });
        expect(container.querySelector(`[data-slot="topbar-${region}"]`)).toHaveTextContent(`contenu ${region}`);
        expect(levelsRendered(container).length).toBeGreaterThanOrEqual(level);
        unmount();
      }
    });

    it('la région gauche cède sa place à la recherche en mobile seulement si la peau le demande', () => {
      const mobile: TopBarUi = { ...ui, searchOpen: true, isMobile: true, isDesktop: false };
      registerTopBarItem({ id: 'gauche-test', region: 'l1-left', component: () => <u>gauche</u> });
      const yielding = { ...fullSkin, yieldLeftToSearch: true, rightFull: 'full' };
      const { container } = render(
        <TopBarUiProvider value={mobile}>
          <TopBarLevels
            config={{ min: 2, max: 8, disabled: [] }}
            skinFor={({ isFirst }) => (isFirst ? yielding : COMPACT_SKIN)}
          />
        </TopBarUiProvider>,
      );
      expect(container.querySelector('[data-slot="topbar-l1-left"]')).toHaveClass('hidden');
      expect(container.querySelector('[data-slot="topbar-l1-right"]')).toHaveClass('full');
      expect(container.querySelector('[data-slot="topbar-l2-left"]')).not.toHaveClass('hidden');
    });
  });
});
