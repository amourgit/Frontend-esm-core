import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { type NavItem } from './DropdownNavigation';
import { TopBarLevel2 } from './TopBarLevel2';
import { bindNavSelection } from '../../utils/navSelection';
import { playXboxSound } from '../../utils/xboxAudio';
import { useWorkspace } from '../../context/WorkspaceContext';
import { useIsDesktop, useIsMobile } from '../../hooks/useMediaQuery';
import { TopBarRegion, TopBarUiProvider, type TopBarUi } from '../../kit';
import { GlobalCallbacksProvider } from '../../global/GlobalCallbacks';
import { TopBarNavProvider } from '../../global/NavContext';
import { registerGlobalTopBarItems } from '../../global/items';
import styles from './topbar-level1.scss';

// Éléments globaux enregistrés une seule fois, avant le premier rendu (pas de scintillement).
registerGlobalTopBarItems();

/** Chemins considérés comme "accueil" (le core sert l'accueil sur /home ; les autres sont des alias GED). */
const HOME_PATHS = ['/', '/home', '/accueil'];

export interface SupremeIntranetTopBarProps {
  onOpenGlobalSearch?: () => void;
  onShowNotification?: (msg: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
}

// =============================================================================
//  TOPBAR — hôte
//
//  Ne contient AUCUN élément : il porte l'état d'interface partagé (panneau ouvert, recherche, taille d'écran),
//  la navigation du niveau 2 et dispose les régions du niveau 1 (gauche / centre / droite). Tout ce qui
//  s'affiche vient d'éléments globaux (`global/items.tsx`) ou d'extensions d'apps (slots `topbar-*-slot`).
//  Contrat complet : kit/regions.ts (régions) et kit/layout-store.ts (personnalisation par une app).
// =============================================================================
export function SupremeIntranetTopBar({ onOpenGlobalSearch, onShowNotification }: SupremeIntranetTopBarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname.replace(/\/+$/, '') || '/';
  const isHome = HOME_PATHS.includes(currentPath);
  const { currentWorkspace } = useWorkspace();

  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [showFullNav, setShowFullNav] = useState(false);
  const isMobile = useIsMobile();
  const isDesktop = useIsDesktop();
  const menuRef = useRef<HTMLDivElement>(null);

  // Hors accueil : retour au fil d'Ariane
  useEffect(() => {
    if (!isHome) setShowFullNav(false);
  }, [isHome]);

  // Clic à l'extérieur : ferme panneaux et recherche
  useEffect(() => {
    function onDown(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActiveMenu(null);
        setSearchOpen(false);
      }
    }
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, []);

  const ui = useMemo<TopBarUi>(
    () => ({
      activeMenu,
      isActivePanel: (name) => activeMenu === name,
      togglePanel: (name) => {
        playXboxSound('toggle');
        setActiveMenu((prev) => (prev === name ? null : name));
      },
      hidePanel: (name) => () => setActiveMenu((prev) => (prev === name ? null : prev)),
      closePanels: () => setActiveMenu(null),
      searchOpen,
      setSearchOpen,
      isMobile,
      isDesktop,
    }),
    [activeMenu, searchOpen, isMobile, isDesktop],
  );

  // Niveau 2 : arborescence déclarée par les apps (slot), reliée à la logique de clic globale
  const navItems = useMemo<NavItem[]>(
    () =>
      bindNavSelection(currentWorkspace.navItems || [], {
        workspaceId: currentWorkspace.id,
        runDefault: (route) => {
          playXboxSound('select');
          setShowFullNav(false);
          if (route) navigate(`/${route}`);
        },
      }),
    [currentWorkspace, navigate],
  );

  const nav = useMemo(
    () => ({
      isHome,
      showFullNav,
      onShowFullNav: () => setShowFullNav(true),
      onHideFullNav: () => setShowFullNav(false),
      navItems,
    }),
    [isHome, showFullNav, navItems],
  );

  // Recherche ouverte en mobile : la zone gauche cède la place (voir `hideOnSearch` des éléments)
  const hideLeft = searchOpen && isMobile;

  return (
    <div
      ref={menuRef}
      className="w-full shrink-0 z-50 select-none relative font-sans text-slate-100 overflow-visible bg-transparent"
    >
      <TopBarUiProvider value={ui}>
        <GlobalCallbacksProvider value={{ onOpenGlobalSearch, onShowNotification }}>
          <TopBarNavProvider value={nav}>
            <header className="w-full bg-transparent transition-colors overflow-visible flex flex-col">
              {/* NIVEAU 1 — trois régions extensibles */}
              <div className={styles.row}>
                <TopBarRegion id="l1-left" className={hideLeft ? 'hidden' : styles.regionLeft} />
                <TopBarRegion id="l1-center" className={styles.regionCenter} />
                <TopBarRegion
                  id="l1-right"
                  className={hideLeft ? `${styles.regionRight} ${styles.regionRightFull}` : styles.regionRight}
                />
              </div>

              {/* NIVEAU 2 — trois régions extensibles */}
              <TopBarLevel2 />
            </header>
          </TopBarNavProvider>
        </GlobalCallbacksProvider>
      </TopBarUiProvider>
    </div>
  );
}
