import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { interpolateUrl, navigate as frameworkNavigate, useConfig } from '@egen-civitas/esm-framework';
import { EgenLogo } from '../components/ui/EgenLogo';
import { GooeyInput } from '../components/ui/GooeyInput';
import { WorkspaceAndSiteSelectorsColumn } from '../components/shell/WorkspaceAndSiteSelectorsColumn';
import { DropdownNavigation } from '../components/shell/DropdownNavigation';
import { BreadcrumbLevel2Nav } from '../components/navigation/BreadcrumbLevel2Nav';
import { TopBarMenuPanel } from '../components/shell/TopBarMenuPanel';
import {
  AppsMenuOption,
  FullscreenOption,
  LanguageOption,
  QuickAccessOption,
  ThemeToggleOption,
  UserMenuOption,
} from '../components/options';
import { ExtensionSlot } from '@egen-civitas/esm-framework';
import { playXboxSound } from '../utils/xboxAudio';
import { type ConfigSchema } from '../../config-schema';
import { registerTopBarItem, useTopBarUi } from '../kit';
import { useGlobalCallbacks } from './GlobalCallbacks';
import { useTopBarNav } from './NavContext';
import optionStyles from '../components/options/topbar-options.scss';
import styles from '../components/shell/topbar-level1.scss';

// =============================================================================
//  ÉLÉMENTS GLOBAUX DE LA TOPBAR — indépendants de toute app métier
//
//  Logo + sélecteurs, recherche, langue, lanceur, raccourcis, plein écran, thème, menu utilisateur,
//  horloge, panneau latéral et navigation de niveau 2. Chacun s'enregistre dans une région du kit ;
//  une app peut les masquer ou les remplacer (voir kit/layout-store.ts) sans toucher à ce fichier.
//  « Implementer tools » n'est plus ici : c'est une option du rail droit (esm-implementer-tools-app).
// =============================================================================

const BrandItem: React.FC = () => {
  const navigate = useNavigate();
  const { onShowNotification } = useGlobalCallbacks();
  return (
    <div className={styles.left}>
      <div
        onClick={() => {
          playXboxSound('select');
          navigate('/home');
        }}
        className={`${styles.logoLink} group hover:opacity-95 transition-opacity`}
        title="EGEN — Écosystème Gouvernemental de l’Économie Numérique"
      >
        <EgenLogo size="nav" variant="full" />
      </div>
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

const UserItem: React.FC = () => {
  const ui = useTopBarUi();
  return <UserMenuOption open={ui.isActivePanel('userMenu')} onToggle={() => ui.togglePanel('userMenu')} />;
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

/** Navigation du niveau 2 : menu déroulant (accueil) ou fil d'Ariane, plus leurs slots historiques. */
const NavItem2: React.FC = () => {
  const ui = useTopBarUi();
  const { isHome, showFullNav, onShowFullNav, onHideFullNav, navItems } = useTopBarNav();
  const dropdown = isHome || showFullNav;
  const state = { ...ui };
  return (
    <div data-slot="topbar-nav" className="flex min-w-0 flex-1 items-center justify-between gap-2">
      {dropdown ? (
        <>
          <ExtensionSlot name="top-nav-level2-start-slot" state={state} className="flex shrink-0 items-center" />
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
          <ExtensionSlot name="top-nav-level2-start-slot" state={state} className="flex shrink-0 items-center" />
          <BreadcrumbLevel2Nav onToggleFullMenu={onShowFullNav} />
          <ExtensionSlot name="top-nav-breadcrumb-slot" className={optionStyles.breadcrumbSlot} />
        </div>
      )}
    </div>
  );
};

let registered = false;

/** Enregistre les éléments globaux (idempotent). */
export function registerGlobalTopBarItems(): void {
  if (registered) return;
  registered = true;
  // Niveau 1
  registerTopBarItem({ id: 'brand', region: 'l1-left', order: 0, component: BrandItem, hideOnSearch: 'mobile' });
  registerTopBarItem({ id: 'search', region: 'l1-right', order: 0, component: SearchItem });
  registerTopBarItem({ id: 'language', region: 'l1-right', order: 10, component: LanguageOption as React.FC, hideOnSearch: 'touch' });
  registerTopBarItem({ id: 'divider', region: 'l1-right', order: 20, component: DividerItem, hideOnSearch: 'touch' });
  registerTopBarItem({ id: 'apps', region: 'l1-right', order: 30, component: AppsItem, hideOnSearch: 'touch' });
  registerTopBarItem({ id: 'quick-access', region: 'l1-right', order: 40, component: QuickAccessItem, hideOnSearch: 'touch' });
  registerTopBarItem({ id: 'fullscreen', region: 'l1-right', order: 60, component: FullscreenOption as React.FC, visibleFrom: 'desktop' });
  registerTopBarItem({ id: 'theme', region: 'l1-right', order: 70, component: ThemeToggleOption as React.FC, visibleFrom: 'desktop' });
  registerTopBarItem({ id: 'user', region: 'l1-right', order: 90, component: UserItem, hideOnSearch: 'touch' });
  registerTopBarItem({ id: 'clock', region: 'l1-right', order: 100, component: ClockItem });
  registerTopBarItem({ id: 'menu-panel', region: 'l1-right', order: 110, component: MenuPanelItem, hideOnSearch: 'touch' });
  // Niveau 2
  registerTopBarItem({ id: 'nav', region: 'l2-center', order: 0, component: NavItem2 });
  // Si le niveau 2 n'est pas rendu (config `topbar.levels`), la navigation s'affiche au centre du niveau 1.
}
