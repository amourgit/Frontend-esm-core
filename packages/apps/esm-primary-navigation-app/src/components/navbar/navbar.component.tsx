import { Header, HeaderContainer, HeaderGlobalBar, HeaderMenuButton } from '@carbon/react';
import {
  ConfigurableLink,
  ExtensionSlot,
  useAssignedExtensions,
  useConfig,
  useLayoutType,
  useLeftNavStore,
  useSession,
} from '@eigen/esm-framework';
import { useTenant, useTenantMode } from '@eigen/esm-tenant';
import React, { useCallback, useMemo, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { isDesktop } from '../../utils';
import Logo from '../logo/logo.component';
import NotificationsMenuPanel from '../navbar-header-panels/notifications-menu-panel.component';
import SideMenuPanel from '../navbar-header-panels/side-menu-panel.component';
import styles from './navbar.scss';

const HeaderItems: React.FC = () => {
  const config = useConfig();
  const [activeHeaderPanel, setActiveHeaderPanel] = useState<string>(null);
  const layout = useLayoutType();
  const { slotName, mode } = useLeftNavStore();
  const navMenuItems = useAssignedExtensions(slotName);
  const isActivePanel = useCallback((panelName: string) => activeHeaderPanel === panelName, [activeHeaderPanel]);

  const togglePanel = useCallback((panelName: string) => {
    setActiveHeaderPanel((activeHeaderPanel) => (activeHeaderPanel === panelName ? null : panelName));
  }, []);

  const hidePanel = useCallback(
    (panelName: string) => () => {
      setActiveHeaderPanel((activeHeaderPanel) => (activeHeaderPanel === panelName ? null : activeHeaderPanel));
    },
    [],
  );

  const showHamburger = useMemo(
    () => (!isDesktop(layout) || mode === 'collapsed') && mode !== 'hidden' && navMenuItems.length > 0,
    [navMenuItems.length, layout, mode],
  );

  return (
    <>
      <Header aria-label="Egen" className={styles.topNavHeader}>
        {showHamburger && (
          <HeaderMenuButton
            aria-label="Open menu"
            isCollapsible
            className={styles.headerMenuButton}
            onClick={() => {
              togglePanel('sideMenu');
            }}
            onMouseDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            isActive={isActivePanel('sideMenu')}
          />
        )}
        <ConfigurableLink to={config.logo.link}>
          <div className={showHamburger ? '' : styles.spacedLogo}>
            <Logo />
          </div>
        </ConfigurableLink>
        <div className={styles.divider} />
        <ExtensionSlot name="top-nav-info-slot" className={styles.topNavInfoSlot} />
        <HeaderGlobalBar className={styles.headerGlobalBar}>
          <ExtensionSlot
            name="top-nav-actions-slot"
            state={{ isActivePanel, togglePanel, hidePanel }}
            className={styles.topNavActionsSlot}
          />
          <ExtensionSlot
            name="notifications-menu-button-slot"
            state={{
              isActivePanel: isActivePanel,
              togglePanel: togglePanel,
            }}
          />
          <ExtensionSlot
            name="top-nav-app-menu-slot"
            state={{ isActivePanel, togglePanel, hidePanel }}
            className={styles.topNavActionsSlot}
          />
          <SideMenuPanel hidePanel={hidePanel('sideMenu')} expanded={isActivePanel('sideMenu')} />
          <NotificationsMenuPanel expanded={isActivePanel('notificationsMenu')} />
        </HeaderGlobalBar>
      </Header>
    </>
  );
};

// =============================================================================
//  NAVBAR — Barre de navigation des espaces tenant authentifiés
//
//  Ce composant est monté UNIQUEMENT sur les routes non-publiques (via le
//  routeRegex de routes.json qui exclut login, logout, home, etc.).
//
//  Logique de rendu :
//    1. Utilisateur authentifié → rend le Header Carbon complet
//    2. Non authentifié → redirige vers /login (avec slug tenant si mode multi)
//
//  useSession() utilise Suspense — ce composant est wrappé dans une limite
//  Suspense par HeaderContainer (Carbon) ou la limite racine de l'app.
// =============================================================================
const Navbar: React.FC = () => {
  const session = useSession();
  const tenantMode = useTenantMode();
  const activeTenant = useTenant();
  const egenSpaBase = window['getEgenSpaBase']();

  const currentReferrer = window.location.pathname.slice(
    window.location.pathname.indexOf(egenSpaBase) + egenSpaBase.length - 1,
  );

  if (session?.authenticated && session?.user?.person) {
    return <HeaderContainer render={HeaderItems}></HeaderContainer>;
  }

  // Non connecté — injecter le tenant dans l'URL de login si mode multi-tenant
  const tenantParam =
    tenantMode === 'multi' && activeTenant?.id
      ? `?tenant=${encodeURIComponent(activeTenant.id)}`
      : '';

  return (
    <Navigate
      to={`/login${tenantParam}`}
      state={{ referrer: currentReferrer }}
    />
  );
};

export default Navbar;
