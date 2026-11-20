import React, { useEffect, useMemo, useState } from 'react';
import { BrowserRouter, useLocation, useNavigate } from 'react-router-dom';
import { ExtensionSlot } from '@egen-civitas/esm-framework';
import { BreadcrumbNav } from './components/navigation/BreadcrumbNav';
import { DropdownNavigation, type NavItem } from './components/shell/DropdownNavigation';
import { WorkspaceProvider, useWorkspace } from './context/WorkspaceContext';
import { bindNavSelection } from './utils/navSelection';
import styles from './components/navigation/navigation.module.css';

// =============================================================================
//  NAVIGATION — extension de la TopBar
//
//  Menu déroulant (accueil, ou « mode complet » à la demande) ou fil d'Ariane contextuel, plus leurs slots. La TopBar ne
//  connaît ni l'un ni l'autre : cette app l'injecte dans `topbar-slot` (placement dans `meta.topbar`, routes.json).
//  Les données viennent des apps : entrées `topbar-nav-slot` (arbre), `topbar-nav-start-slot` / `top-nav-breadcrumb-slot`
//  (compléments) et le contexte que les pages publient (`breadcrumb-context.ts`).
//
//  L'extension vit dans son propre parcel : elle monte son routeur et son contexte d'Espace elle-même.
// =============================================================================

/** Chemins considérés comme « accueil » (le core sert l'accueil sur /home ; les autres sont des alias). */
const HOME_PATHS = ['/', '/home', '/accueil'];

/** Slots qui précèdent la navigation. */
const NAV_START_SLOTS = ['topbar-nav-start-slot'] as const;

/** État que la TopBar transmet à toute extension (reçu ici comme props, tous facultatifs). */
export interface TopBarState {
  activeMenu?: string | null;
  isActivePanel?: (panelId: string) => boolean;
  togglePanel?: (panelId: string) => void;
  hidePanel?: (panelId: string) => () => void;
  closePanels?: () => void;
  searchOpen?: boolean;
  setSearchOpen?: (open: boolean) => void;
  isMobile?: boolean;
  isDesktop?: boolean;
}

const NavigationContent: React.FC<TopBarState> = (props) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentWorkspace } = useWorkspace();
  const currentPath = location.pathname.replace(/\/+$/, '') || '/';
  const isHome = HOME_PATHS.includes(currentPath);
  const [showFullNav, setShowFullNav] = useState(false);

  // Hors accueil : retour au fil d'Ariane.
  useEffect(() => {
    if (!isHome) setShowFullNav(false);
  }, [isHome]);

  // Arborescence déclarée par les apps (slot), reliée à la logique de clic globale.
  const navItems = useMemo<NavItem[]>(
    () =>
      bindNavSelection(currentWorkspace.navItems || [], {
        workspaceId: currentWorkspace.id,
        runDefault: (route) => {
          setShowFullNav(false);
          if (route) navigate(`/${route}`);
        },
      }),
    [currentWorkspace, navigate],
  );

  const { activeMenu, isActivePanel, togglePanel, hidePanel, closePanels, searchOpen, setSearchOpen, isMobile, isDesktop } =
    props;
  // Objet stable : un nouvel `state` à chaque rendu relancerait `updateExtensionSlotState` des slots.
  const state = useMemo(
    () => ({ activeMenu, isActivePanel, togglePanel, hidePanel, closePanels, searchOpen, setSearchOpen, isMobile, isDesktop }),
    [activeMenu, isActivePanel, togglePanel, hidePanel, closePanels, searchOpen, setSearchOpen, isMobile, isDesktop],
  );

  const dropdown = isHome || showFullNav;
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
              onClick={() => setShowFullNav(false)}
              className="shrink-0 cursor-pointer rounded-lg bg-white/10 px-2 py-1 text-xs text-slate-300 transition-colors hover:bg-white/15 hover:text-white"
            >
              Mode Fil d'ariane
            </button>
          )}
        </>
      ) : (
        <div className="flex min-w-0 flex-1 items-center gap-3">
          {startSlots}
          <BreadcrumbNav onToggleFullMenu={() => setShowFullNav(true)} />
          <ExtensionSlot name="top-nav-breadcrumb-slot" className={styles.breadcrumbSlot} />
        </div>
      )}
    </div>
  );
};

const Navigation: React.FC<TopBarState> = (props) => (
  <BrowserRouter basename={window.getEgenSpaBase()}>
    <WorkspaceProvider>
      <NavigationContent {...props} />
    </WorkspaceProvider>
  </BrowserRouter>
);

export default Navigation;
