/* eslint-disable testing-library/no-container, testing-library/no-node-access --
   Ce test vérifie le SQUELETTE du DOM (niveaux `data-level`, régions `data-region`) : ce sont des contrats de
   structure sans rôle ARIA ni texte accessible, donc inatteignables par les requêtes Testing Library. */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';

type Meta = { global?: boolean; topbar?: unknown };
const state = vi.hoisted(() => ({
  assigned: [] as Array<{ id: string; name: string; moduleName: string; meta?: unknown }>,
  orders: {} as Record<string, number>,
  active: new Set<string>(),
  claims: {} as Record<string, unknown>,
  transient: [] as unknown[],
  transientAssigned: [] as Array<{ id: string; name: string; moduleName: string }>,
}));

vi.mock('@egen-civitas/esm-framework/src/internal', () => ({
  getExtensionInternalStore: () => ({
    getState: () => ({
      extensions: Object.fromEntries(Object.entries(state.orders).map(([n, order]) => [n, { order }])),
    }),
    subscribe: () => () => {},
  }),
  getExtensionStore: () => ({
    getState: () => ({ slots: { 'topbar-slot': { assignedExtensions: state.assigned } } }),
    subscribe: () => () => {},
  }),
}));
vi.mock('@egen-civitas/esm-framework', () => ({
  getGlobalStore: (name: string) => ({ __name: name }),
  useStore: (store: { __name?: string }) =>
    store.__name === 'egen-topbar-transient' ? { levels: state.transient } : { claims: state.claims },
  ExtensionSlot: (props: { name: string; className?: string; select?: (e: unknown[]) => Array<{ id: string }> }) => {
    const all = props.name === 'topbar-slot' ? state.assigned : state.transientAssigned;
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
import { registerTopBarItem, type TopBarItemInput } from './items';

// Le registre d'éléments est global : tout élément enregistré par un test est désenregistré à la fin.
const registered: Array<() => void> = [];
const registerItem = (item: TopBarItemInput) => {
  registered.push(registerTopBarItem(item));
};

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

const APP = '@egen/esm-annuaire-app';

/** Une app attache `id` au slot unique et DÉCLARE son placement dans `meta.topbar`. */
function declare(id: string, topbar: unknown, moduleName = APP, meta: Meta = {}, order?: number) {
  state.assigned = [...state.assigned, { id, name: id, moduleName, meta: { ...meta, topbar } }];
  if (order !== undefined) state.orders[id] = order;
}

const renderBar = (config?: Parameters<typeof TopBarLevels>[0]['config'], skinFor = firstRowFull) =>
  render(
    <TopBarUiProvider value={ui}>
      <TopBarLevels config={config} skinFor={skinFor} />
    </TopBarUiProvider>,
  );

const levelsRendered = (container: HTMLElement) =>
  Array.from(container.querySelectorAll('[data-level]')).map((n) => n.getAttribute('data-level'));

const regionOf = (container: HTMLElement, level: string, region: string) =>
  container.querySelector(`[data-level="${level}"] [data-region="${region}"]`) as HTMLElement;

/** Contenu visible d'une région, dans l'ordre (les ids des extensions et des éléments). */
const content = (container: HTMLElement, level: string, region: string) =>
  Array.from(regionOf(container, level, region).children)
    .map((c) => c.textContent)
    .filter(Boolean);

describe('TopBarLevels — niveaux déclarés par les apps', () => {
  afterEach(() => {
    registered.splice(0).forEach((off) => off());
    vi.restoreAllMocks();
  });

  beforeEach(() => {
    state.assigned = [];
    state.orders = {};
    state.active = new Set([APP]);
    state.claims = {};
    state.transient = [];
    state.transientAssigned = [];
  });

  it('sans aucune déclaration, aucun niveau n’est rendu : la TopBar ne fige rien', () => {
    const { container } = renderBar();
    expect(levelsRendered(container)).toEqual([]);
  });

  it('un niveau naît de la déclaration d’une app, avec le nom qu’elle choisit', () => {
    declare('annonce', { level: 'promo', region: 'center' });
    const { container } = renderBar();
    expect(levelsRendered(container)).toEqual(['promo']);
    expect(content(container, 'promo', 'center')).toEqual(['annonce']);
  });

  it('plusieurs apps déclarent le même niveau : il est créé une fois et assemble leurs composants', () => {
    state.active = new Set([APP, '@egen/esm-sites-app']);
    declare('a', { level: 'promo', region: 'right', order: 20 });
    declare('b', { level: 'promo', region: 'right', order: 10 }, '@egen/esm-sites-app');
    declare('c', { level: 'promo', region: 'left' }, '@egen/esm-sites-app');
    const { container } = renderBar();
    expect(levelsRendered(container)).toEqual(['promo']);
    expect(content(container, 'promo', 'right')).toEqual(['b', 'a']);
    expect(content(container, 'promo', 'left')).toEqual(['c']);
  });

  it('une extension d’une app inactive n’apparaît pas, sauf si elle est globale', () => {
    declare('locale', { level: 'promo' }, '@egen/esm-autre-app');
    declare('globale', { level: 'main' }, '@egen/esm-autre-app', { global: true });
    const { container } = renderBar();
    expect(levelsRendered(container)).toEqual(['main']);
    expect(screen.queryByText('locale')).not.toBeInTheDocument();
  });

  it('l’ordre de la région vient de `meta.topbar.order`, à défaut de l’`order` du routes.json', () => {
    declare('z', { level: 'main', region: 'right' }, APP, {}, 5);
    declare('y', { level: 'main', region: 'right', order: 1 }, APP, {}, 99);
    const { container } = renderBar();
    expect(content(container, 'main', 'right')).toEqual(['y', 'z']);
  });

  it('éléments globaux et extensions s’entrelacent dans un seul ordre (extension avant élément à égalité)', () => {
    registerItem({
      id: 'horloge',
      placement: { level: 'main', region: 'right', order: 100 },
      component: () => <i>horloge</i>,
    });
    registerItem({
      id: 'theme',
      placement: { level: 'main', region: 'right', order: 70 },
      component: () => <i>theme</i>,
    });
    declare('profil', { level: 'main', region: 'right', order: 90 });
    declare('egal', { level: 'main', region: 'right', order: 70 });
    const { container } = renderBar();
    expect(content(container, 'main', 'right')).toEqual(['egal', 'theme', 'profil', 'horloge']);
  });

  describe('pile des niveaux', () => {
    it('les niveaux sont classés par rang ; sans rang, sous les classés, par nom', () => {
      declare('x', { level: 'zebre' });
      declare('y', { level: 'bas', rank: 90 });
      declare('z', { level: 'haut', rank: 10 });
      declare('w', { level: 'alpha' });
      const { container } = renderBar();
      expect(levelsRendered(container)).toEqual(['haut', 'bas', 'alpha', 'zebre']);
    });

    it('`topbar.levels.order` épingle des niveaux en tête et prime sur les rangs', () => {
      declare('y', { level: 'bas', rank: 90 });
      declare('z', { level: 'haut', rank: 10 });
      const { container } = renderBar({ order: ['bas'] });
      expect(levelsRendered(container)).toEqual(['bas', 'haut']);
    });

    it('`topbar.levels.keep` rend un niveau même vide', () => {
      declare('z', { level: 'main', rank: 1 });
      const { container } = renderBar({ keep: ['reserve'] });
      expect(levelsRendered(container)).toEqual(['main', 'reserve']);
    });

    it('un niveau masqué reporte son contenu sur le niveau précédent, même région', () => {
      declare('a', { level: 'main', rank: 1, region: 'right' });
      declare('b', { level: 'promo', rank: 2, region: 'right' });
      declare('c', { level: 'dernier', rank: 3, region: 'center' });
      const { container } = renderBar({ hidden: ['promo', 'dernier'] });
      expect(levelsRendered(container)).toEqual(['main']);
      // le contenu du niveau d'accueil passe d'abord, puis celui qu'il accueille
      expect(content(container, 'main', 'right')).toEqual(['a', 'b']);
      expect(content(container, 'main', 'center')).toEqual(['c']);
    });

    it('`max` limite les niveaux rendus : le surplus s’affiche sur le dernier niveau rendu', () => {
      declare('a', { level: 'un', rank: 1 });
      declare('b', { level: 'deux', rank: 2 });
      declare('c', { level: 'trois', rank: 3 });
      const { container } = renderBar({ max: 2 });
      expect(levelsRendered(container)).toEqual(['un', 'deux']);
      expect(content(container, 'deux', 'left')).toEqual(['b', 'c']);
    });
  });

  describe('position par référence', () => {
    it('`after` / `before` placent le composant à côté de sa référence', () => {
      declare('ref', { level: 'main', region: 'right', order: 10 });
      declare('apres', { level: 'main', region: 'right', order: 999, after: 'ref' });
      declare('avant', { level: 'main', region: 'right', order: 999, before: 'ref' });
      declare('fin', { level: 'main', region: 'right', order: 50 });
      const { container } = renderBar();
      expect(content(container, 'main', 'right')).toEqual(['avant', 'ref', 'apres', 'fin']);
    });

    it('la référence prime sur la région déclarée : le composant suit sa cible, même dans une autre région', () => {
      declare('cible', { level: 'main', region: 'center' });
      declare('suiveur', { level: 'main', region: 'left', after: 'cible' });
      const { container } = renderBar();
      expect(content(container, 'main', 'center')).toEqual(['cible', 'suiveur']);
      expect(content(container, 'main', 'left')).toEqual([]);
    });

    it('référence absente (app non montée) : région et ordre déclarés s’appliquent', () => {
      declare('seul', { level: 'main', region: 'right', after: 'inexistante' });
      const { container } = renderBar();
      expect(content(container, 'main', 'right')).toEqual(['seul']);
    });

    it('un cycle de références est ignoré sans casser la TopBar', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      declare('a', { level: 'main', region: 'right', order: 1, after: 'b' });
      declare('b', { level: 'main', region: 'right', order: 2, after: 'a' });
      const { container } = renderBar();
      expect(content(container, 'main', 'right')).toEqual(['a', 'b']);
      expect(warn).toHaveBeenCalled();
    });
  });

  it('une déclaration invalide n’affiche rien et avertit, sans jamais casser la TopBar', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    declare('sans-placement', undefined);
    declare('niveau-invalide', { level: 'Niveau 2' });
    declare('niveau-numerique', { level: 2 });
    declare('region-inconnue', { level: 'main', region: 'milieu' });
    declare('valide', { level: 'main' });
    const { container } = renderBar();
    expect(levelsRendered(container)).toEqual(['main']);
    expect(content(container, 'main', 'left')).toEqual(['valide']);
    expect(warn).toHaveBeenCalledTimes(4);
  });

  describe('personnalisation par une app montée (layout)', () => {
    it('une règle de région vise `<niveau>:<région>` et ne vaut que tant que l’app est active', () => {
      declare('cible', { level: 'main', region: 'right' }, APP, { global: true });
      declare('reste', { level: 'main', region: 'right' }, APP, { global: true });
      state.claims = { [APP]: { regions: { 'main:right': { hide: ['cible'] } } } };
      const { container: withApp, unmount } = renderBar();
      expect(content(withApp, 'main', 'right')).toEqual(['reste']);
      unmount();

      state.active = new Set(['@egen/esm-autre-app']);
      const { container: withoutApp } = renderBar();
      expect(content(withoutApp, 'main', 'right')).toEqual(['cible', 'reste']);
    });

    it('`levels.keep` et `levels.hide` d’une app active ajoutent ou retirent des niveaux', () => {
      declare('a', { level: 'main', rank: 1 });
      declare('b', { level: 'promo', rank: 2 });
      state.claims = { [APP]: { levels: { keep: ['reserve'], hide: ['promo'] } } };
      const { container } = renderBar();
      expect(levelsRendered(container)).toEqual(['main', 'reserve']);
      expect(content(container, 'main', 'left')).toEqual(['a', 'b']);
    });

    it('fond d’un niveau : transparent par défaut, surchargé par une app active', () => {
      declare('a', { level: 'main', rank: 1 });
      declare('b', { level: 'promo', rank: 2 });
      const view = renderBar();
      expect(view.container.querySelector('[data-level="main"]')).not.toHaveAttribute('style');
      view.unmount();

      state.claims = { [APP]: { levels: { background: { main: 'rgb(1, 2, 3)' } } } };
      const { container } = renderBar();
      expect(container.querySelector('[data-level="main"]')).toHaveStyle({ background: 'rgb(1, 2, 3)' });
      expect(container.querySelector('[data-level="promo"]')).not.toHaveAttribute('style');
    });
  });

  it('un composant d’arrière-plan se déclare comme n’importe quel autre : `region: "background"`', () => {
    declare('fond-anime', { level: 'main', region: 'background' });
    const { container } = renderBar();
    expect(regionOf(container, 'main', 'background')).toHaveTextContent('fond-anime');
    expect(regionOf(container, 'main', 'background')).toHaveClass('pointer-events-none');
  });

  it('les extensions reçoivent l’état d’interface, le niveau rendu et la région', () => {
    declare('x', { level: 'main', region: 'right' });
    const { container } = renderBar();
    expect(regionOf(container, 'main', 'right')).toBeInTheDocument();
  });

  it('un niveau éphémère se place après le dernier niveau de la pile', () => {
    declare('a', { level: 'un', rank: 1 });
    declare('b', { level: 'deux', rank: 2 });
    state.transientAssigned = [{ id: 'flash', name: 'flash', moduleName: APP }];
    state.transient = [{ id: 't1', extension: 'flash', openedAt: 0, expiresAt: null, closing: false }];
    const { container } = renderBar();
    const last = container.querySelector('[data-level="deux"]')!;
    const transient = container.querySelector('[data-transient="t1"]')!;
    expect(transient).toHaveTextContent('flash');
    expect(last.compareDocumentPosition(transient) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  describe('squelette uniforme', () => {
    it('toutes les rangées ont le même squelette : arrière-plan + gauche + centre + droite', () => {
      ['a', 'b', 'c', 'd'].forEach((n, i) => declare(n, { level: `niveau-${n}`, rank: i }));
      const { container } = renderBar();
      const rows = Array.from(container.querySelectorAll('[data-level]'));
      expect(rows).toHaveLength(4);
      const skeleton = (row: Element) =>
        Array.from(row.children)
          .map((c) => c.getAttribute('data-region') ?? c.tagName.toLowerCase())
          .join(' | ');
      expect(skeleton(rows[0])).toBe('background | left | center | right');
      // les rangées compactes sont strictement identiques entre elles
      expect(new Set(rows.slice(1).map(skeleton)).size).toBe(1);
    });

    it('la peau dépend de la POSITION, pas du nom du niveau', () => {
      declare('a', { level: 'zzz', rank: 1 });
      declare('b', { level: 'aaa', rank: 2 });
      const seen: Array<{ level: string; index: number; isFirst: boolean; isLast: boolean }> = [];
      const spy = (pos: { level: string; index: number; isFirst: boolean; isLast: boolean }) => {
        seen.push({ level: pos.level, index: pos.index, isFirst: pos.isFirst, isLast: pos.isLast });
        return pos.isFirst ? fullSkin : COMPACT_SKIN;
      };
      const { container } = renderBar(undefined, spy as never);
      expect(seen).toContainEqual({ level: 'zzz', index: 0, isFirst: true, isLast: false });
      expect(seen).toContainEqual({ level: 'aaa', index: 1, isFirst: false, isLast: true });
      expect(container.querySelector('[data-level="zzz"]')).toHaveAttribute('data-level-first');
      expect(container.querySelector('[data-level="zzz"]')).not.toHaveAttribute('role');
      expect(container.querySelector('[data-level="aaa"]')).toHaveAttribute('role', 'toolbar');
    });

    it('sans `skinFor`, tous les niveaux (le premier compris) reçoivent la peau compacte', () => {
      declare('a', { level: 'un', rank: 1 });
      declare('b', { level: 'deux', rank: 2 });
      const { container } = render(
        <TopBarUiProvider value={ui}>
          <TopBarLevels />
        </TopBarUiProvider>,
      );
      container.querySelectorAll('[data-level]').forEach((row) => expect(row).toHaveAttribute('role', 'toolbar'));
    });

    it('un élément se place dans n’importe quelle région de n’importe quel niveau, par son nom', () => {
      for (const [level, region] of [
        ['un', 'left'],
        ['trois', 'center'],
        ['cinq', 'right'],
      ] as const) {
        registerItem({
          id: `libre-${level}`,
          placement: { level, region },
          component: () => <i>{`contenu ${level}`}</i>,
        });
      }
      const { container } = renderBar();
      expect(levelsRendered(container)).toEqual(['cinq', 'trois', 'un']);
      expect(regionOf(container, 'trois', 'center')).toHaveTextContent('contenu trois');
    });

    it('la région gauche cède sa place à la recherche en mobile seulement si la peau le demande', () => {
      const mobile: TopBarUi = { ...ui, searchOpen: true, isMobile: true, isDesktop: false };
      declare('a', { level: 'un', rank: 1, region: 'left' });
      declare('b', { level: 'deux', rank: 2, region: 'left' });
      const yielding = { ...fullSkin, yieldLeftToSearch: true, rightFull: 'full' };
      const { container } = render(
        <TopBarUiProvider value={mobile}>
          <TopBarLevels skinFor={({ isFirst }) => (isFirst ? yielding : COMPACT_SKIN)} />
        </TopBarUiProvider>,
      );
      expect(regionOf(container, 'un', 'left')).toHaveClass('hidden');
      expect(regionOf(container, 'un', 'right')).toHaveClass('full');
      expect(regionOf(container, 'deux', 'left')).not.toHaveClass('hidden');
    });
  });
});
