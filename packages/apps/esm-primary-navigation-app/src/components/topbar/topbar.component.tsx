import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Navigate } from 'react-router-dom';
import {
  ConfigurableLink,
  ExtensionSlot,
  TopBar,
  TopBarDivider,
  TopBarIconButton,
  useAssignedExtensions,
  useConfig,
  useLayoutType,
  useLeftNavStore,
  useSession,
} from '@egen-civitas/esm-framework';
import { useTenantMode } from '@egen-civitas/esm-tenant';
import { isDesktop } from '../../utils';
import { type ConfigSchema } from '../../config-schema';
import Logo from '../logo/logo.component';
import ContextSwitcher from '../context-switcher/context-switcher.component';
import SearchBar from '../search-bar/search-bar.component';
import BreadcrumbNav from '../breadcrumb/breadcrumb.component';
import AppsMenuButton from '../apps-menu/apps-menu-button.component';
import LanguageButton from '../language-button/language-button.component';
import QuickAccessButton from '../quick-access-button/quick-access-button.component';
import FullscreenButton from '../fullscreen-button/fullscreen-button.component';
import ThemeToggleButton from '../theme-toggle/theme-toggle.component';
import NotificationsMenuButton from '../notifications-menu/notifications-menu-button.component';
import UserMenuButton from '../user-menu/user-menu-button.component';
import SideMenuPanel from '../side-menu/side-menu-panel.component';

// =============================================================================
//  TOPBAR — Barre de navigation principale EGEN (composant TopBar Tailwind du framework)
//
//  Layout (space-between), deux niveaux empilés verticalement :
//
//  Niveau 1 :
//    [LEFT]   Hamburger (mobile) · Logo · SearchBar · ContextSwitcher
//    [CENTER] ExtensionSlot top-nav-info-slot (invisible si vide)
//    [RIGHT]  AppsMenu · Langue · Raccourcis · Plein écran · Thème ·
//             Notifications · séparateur · Utilisateur
//  Niveau 2 :
//    BreadcrumbNav (invisible si aucune extension n'y est rattachée)
// =============================================================================

const MenuIcon: React.FC = () => (
  <svg width="20" height="20" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path d="M2 4h12M2 8h12M2 12h12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
  </svg>
);

const TopBarContent: React.FC = () => {
  const { t } = useTranslation();
  const config = useConfig<ConfigSchema>();
  const [activeHeaderPanel, setActiveHeaderPanel] = useState<string | null>(null);
  const layout = useLayoutType();
  const { slotName, mode } = useLeftNavStore();
  const navMenuItems = useAssignedExtensions(slotName);

  const isActivePanel = useCallback((panelName: string) => activeHeaderPanel === panelName, [activeHeaderPanel]);

  const togglePanel = useCallback((panelName: string) => {
    setActiveHeaderPanel((prev) => (prev === panelName ? null : panelName));
  }, []);

  const hidePanel = useCallback(
    (panelName: string) => () => {
      setActiveHeaderPanel((prev) => (prev === panelName ? null : prev));
    },
    [],
  );

  const showHamburger = (!isDesktop(layout) || mode === 'collapsed') && mode !== 'hidden' && navMenuItems.length > 0;
  const slotState = { isActivePanel, togglePanel, hidePanel };

  return (
    <TopBar
      ariaLabel={t('primaryNavigation', 'Navigation principale EGEN')}
      left={
        <>
          {showHamburger && (
            <TopBarIconButton
              label={t('openMenu', 'Ouvrir le menu')}
              icon={<MenuIcon />}
              active={isActivePanel('sideMenu')}
              onClick={() => togglePanel('sideMenu')}
              onMouseDown={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
            />
          )}
          <ConfigurableLink
            to={config.logo?.link ?? '${egenSpaBase}/home'}
            className="flex items-center rounded-md px-1 no-underline transition-opacity hover:opacity-80"
          >
            <Logo />
          </ConfigurableLink>
          <SearchBar />
          <ContextSwitcher />
        </>
      }
      center={<ExtensionSlot name="top-nav-info-slot" className="flex items-center gap-2 truncate text-xs opacity-70" />}
      right={
        <>
          <AppsMenuButton isActivePanel={isActivePanel} togglePanel={togglePanel} hidePanel={hidePanel} />
          <LanguageButton />
          <QuickAccessButton />
          <FullscreenButton />
          <ThemeToggleButton />
          <NotificationsMenuButton isActivePanel={isActivePanel} togglePanel={togglePanel} hidePanel={hidePanel} />
          <ExtensionSlot name="top-nav-actions-slot" state={slotState} className="flex items-center" />
          <TopBarDivider />
          <UserMenuButton isActivePanel={isActivePanel} togglePanel={togglePanel} hidePanel={hidePanel} />
          {/* Point d'extension distinct de "app-menu-slot" (contenu du panneau applications) :
              positionné en toute fin de topbar, après le menu utilisateur. */}
          <ExtensionSlot name="top-nav-trailing-slot" state={slotState} className="flex items-center" />
        </>
      }
      secondary={<BreadcrumbNav />}
    >
      <SideMenuPanel hidePanel={hidePanel('sideMenu')} expanded={isActivePanel('sideMenu')} />
    </TopBar>
  );
};

// =============================================================================
//  TOPBAR — Garde d'authentification (LOGIQUE PRÉSERVÉE À L'IDENTIQUE)
//
//  RESPONSABILITÉ :
//    • Rend la topbar quand l'utilisateur est connecté.
//    • En mode SINGLE/OFF : redirige vers /login si non connecté
//      (le Guard tenant est silencieux dans ces modes).
//    • En mode MULTI : NE redirige PAS (le TenantRoutingGuard le fait déjà) ;
//      rendre null évite une navigation simultanée contradictoire.
//
//  RÈGLE D'OR :
//    Mode multi  → Guard redirige vers /login,  TopBar rend null
//    Mode single → Guard silencieux,             TopBar redirige vers /login
// =============================================================================
const TopBar: React.FC = () => {
  const session = useSession();
  const tenantMode = useTenantMode();
  const egenSpaBase = window['getEgenSpaBase']();

  const currentReferrer = window.location.pathname.slice(
    window.location.pathname.indexOf(egenSpaBase) + egenSpaBase.length - 1,
  );

  // Connecté → rendre la topbar complète (tous modes)
  if (session?.authenticated && session?.user?.person) {
    return <TopBarContent />;
  }

  // Non connecté, mode multi → Guard TenantRoutingGuard gère la redirection
  if (tenantMode === 'multi') {
    return null;
  }

  // Non connecté, mode SINGLE / OFF → TopBar gère la redirection
  return <Navigate to="/login" state={{ referrer: currentReferrer }} />;
};

export default TopBar;
