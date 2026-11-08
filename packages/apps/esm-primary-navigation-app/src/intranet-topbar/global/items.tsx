import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ExtensionSlot, interpolateUrl, navigate as frameworkNavigate, useConfig } from '@egen-civitas/esm-framework';
import { GooeyInput } from '../components/ui/GooeyInput';
import { WorkspaceAndSiteSelectorsColumn } from '../components/shell/WorkspaceAndSiteSelectorsColumn';
import { DropdownNavigation } from '../components/shell/DropdownNavigation';
import { BreadcrumbNav } from '../components/navigation/BreadcrumbNav';
import { TopBarMenuPanel } from '../components/shell/TopBarMenuPanel';
import {
  AppsMenuOption,
  FullscreenOption,
  LanguageOption,
  QuickAccessOption,
  ThemeToggleOption,
} from '../components/options';
import { playXboxSound } from '../utils/xboxAudio';
import { type ConfigSchema } from '../../config-schema';
import { registerTopBarItem, useTopBarUi, type TopBarItem } from '../kit';
import { resolvePlacement, type GlobalItemId } from './placement';
import { useGlobalCallbacks } from './GlobalCallbacks';
import { useTopBarNav } from './NavContext';
import optionStyles from '../components/options/topbar-options.scss';
import styles from '../components/shell/topbar-global-items.scss';

// =============================================================================
//  ÉLÉMENTS GLOBAUX DE LA TOPBAR — indépendants de toute app métier
//
//  Sélecteurs d'espace et de site, recherche, langue, lanceur, raccourcis, plein écran, thème, menu utilisateur,
//  horloge, panneau latéral et navigation. Chacun s'enregistre dans une région du kit, là où l'indique
//  `placement.ts` (surchargeable par la config `topbar.placement`) : ce fichier ne connaît AUCUN niveau.
//  Une app peut les masquer ou les remplacer (voir kit/layout-store.ts) sans toucher à ce fichier.
//  « Implementer tools » n'est plus ici : c'est une option du rail droit (esm-implementer-tools-app).
// =============================================================================

const ContextSelectorsItem: React.FC = () => {
  const { onShowNotification } = useGlobalCallbacks();
  return (
    <div className={styles.left}>
      <WorkspaceAndSiteSelectorsColumn onShowNotification={onShowNotification} />
    </div>
  );
};

const SearchItem: React.FC = () => {
  const ui = useTopBarUi();
  const config = useConfig<ConfigSchema>();
  const { onOpenGlobalSearch } = useGlobalCallbacks();
  const [query, setQuery] = useState('');
  const hideLeft = ui.searchOpen && ui.isMobile;

  return (
    <div
      className="relative overflow-visible flex items-center justify-start gap-2"
      style={hideLeft ? { flex: '1 1 auto' } : undefined}
    >
      <GooeyInput
        placeholder="Rechercher..."
        collapsedWidth={115}
        expandedWidth={220}
        expandedOffset={40}
        value={query}
        onValueChange={setQuery}
        expanded={ui.searchOpen}
        onOpenChange={ui.setSearchOpen}
        onClick={() => {
          playXboxSound('toggle');
          ui.closePanels();
        }}
        onSubmit={(val) => {
          const q = val.trim();
          if (!q) return;
          frameworkNavigate({ to: `${interpolateUrl(config.search.path)}?q=${encodeURIComponent(q)}` });
          onOpenGlobalSearch?.();
        }}
      />
      {ui.searchOpen && !ui.isDesktop && (
        <button
          type="button"
          onClick={() => {
            playXboxSound('toggle');
            setQuery('');
            ui.setSearchOpen(false);
          }}
          className="text-xs text-teal-300 hover:text-white font-semibold px-3.5 py-1.5 rounded-full backdrop-blur-md bg-white/[0.08] hover:bg-white/[0.16] border border-white/20 hover:border-teal-400/40 shadow-[inset_0_1px_1px_rgba(255,255,255,0.25),0_2px_8px_rgba(0,0,0,0.08)] transition-all cursor-pointer shrink-0 whitespace-nowrap active:scale-95"
          title="Annuler la recherche"
        >
          Annuler
        </button>
      )}
    </div>
  );
};

const DividerItem: React.FC = () => <div aria-hidden="true" className="h-4 w-px bg-white/20 mx-0.5 hidden sm:block" />;

const AppsItem: React.FC = () => {
  const ui = useTopBarUi();
  return <AppsMenuOption open={ui.isActivePanel('appMenu')} onToggle={() => ui.togglePanel('appMenu')} />;
};

const QuickAccessItem: React.FC = () => {
  const ui = useTopBarUi();
  return <QuickAccessOption open={ui.isActivePanel('quickAccess')} onToggle={() => ui.togglePanel('quickAccess')} />;
};

function formatClock() {
  const now = new Date();
  const hours = now.getHours();
  const mins = String(now.getMinutes()).padStart(2, '0');
  const timeStr = `${hours % 12 || 12}:${mins} ${hours >= 12 ? 'PM' : 'AM'}`;
  const date = now.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  return { timeStr, dateLongStr: date.charAt(0).toUpperCase() + date.slice(1) };
}

const ClockItem: React.FC = () => {
  const [{ timeStr, dateLongStr }, setClock] = useState(formatClock);
  useEffect(() => {
    const id = setInterval(() => setClock(formatClock()), 15000);
    return () => clearInterval(id);
  }, []);
  return (
    <div className={styles.clock} aria-live="off">
      <span className={styles.clockTime}>{timeStr}</span>
      <span className={styles.clockDate}>{dateLongStr}</span>
    </div>
  );
};

const MenuPanelItem: React.FC = () => <TopBarMenuPanel />;

/** Slots qui précèdent la navigation : l'officiel puis l'historique (toujours honoré). */
const NAV_START_SLOTS = ['topbar-nav-start-slot', 'top-nav-level2-start-slot'] as const;

/** Navigation : menu déroulant (accueil) ou fil d'Ariane, plus leurs slots. Se place dans la région choisie par `placement.ts`. */
const NavigationItem: React.FC = () => {
  const ui = useTopBarUi();
  const { isHome, showFullNav, onShowFullNav, onHideFullNav, navItems } = useTopBarNav();
  const dropdown = isHome || showFullNav;
  // Objet stable : un nouvel `state` à chaque rendu relancerait `updateExtensionSlotState` des slots.
  const state = useMemo(() => ({ ...ui }), [ui]);
  const startSlots = NAV_START_SLOTS.map((name) => (
    <ExtensionSlot key={name} name={name} state={state} className="flex shrink-0 items-center" />
  ));
  return (
    <div data-slot="topbar-nav" className="flex min-w-0 flex-1 items-center justify-between gap-2">
      {dropdown ? (
        <>
          {startSlots}
          <DropdownNavigation navItems={navItems} />
          {showFullNav && (
            <button
              type="button"
              onClick={onHideFullNav}
              className="shrink-0 cursor-pointer rounded-lg bg-white/10 px-2 py-1 text-xs text-slate-300 transition-colors hover:bg-white/15 hover:text-white"
            >
              Mode Fil d'ariane
            </button>
          )}
        </>
      ) : (
        <div className="flex min-w-0 flex-1 items-center gap-3">
          {startSlots}
          <BreadcrumbNav onToggleFullMenu={onShowFullNav} />
          <ExtensionSlot name="top-nav-breadcrumb-slot" className={optionStyles.breadcrumbSlot} />
        </div>
      )}
    </div>
  );
};

type ItemDefinition = Omit<TopBarItem, 'region' | 'order' | 'id'> & { id: GlobalItemId };

/** Les éléments globaux, SANS placement : la région et l'ordre viennent de `placement.ts`. */
const GLOBAL_ITEMS: readonly ItemDefinition[] = [
  { id: 'context-selectors', component: ContextSelectorsItem, hideOnSearch: 'mobile' },
  { id: 'search', component: SearchItem },
  { id: 'language', component: LanguageOption as React.FC, hideOnSearch: 'touch' },
  { id: 'divider', component: DividerItem, hideOnSearch: 'touch' },
  { id: 'apps', component: AppsItem, hideOnSearch: 'touch' },
  { id: 'quick-access', component: QuickAccessItem, hideOnSearch: 'touch' },
  { id: 'fullscreen', component: FullscreenOption as React.FC, visibleFrom: 'desktop' },
  { id: 'theme', component: ThemeToggleOption as React.FC, visibleFrom: 'desktop' },
  { id: 'clock', component: ClockItem },
  { id: 'menu-panel', component: MenuPanelItem, hideOnSearch: 'touch' },
  { id: 'nav', component: NavigationItem },
];

/**
 * Enregistre (ou ré-enregistre) les éléments globaux selon le placement : usine + surcharges `topbar.placement`.
 * Rappeler la fonction avec un autre placement déplace les éléments (un enregistrement remplace le précédent).
 */
export function registerGlobalTopBarItems(overrides?: Readonly<Record<string, unknown>>): void {
  const placement = resolvePlacement(overrides);
  for (const item of GLOBAL_ITEMS) registerTopBarItem({ ...item, ...placement[item.id] });
}
