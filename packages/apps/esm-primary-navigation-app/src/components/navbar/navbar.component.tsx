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
import { useTenantMode } from '@eigen/esm-tenant';
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
//  RESPONSABILITÉ :
//    • Rend le Carbon Header EIGEN quand l'utilisateur est connecté.
//    • En mode SINGLE/OFF : redirige vers /login si non connecté
//      (car le Guard tenant est silencieux dans ces modes).
//    • En mode MULTI : NE redirige PAS (le TenantRoutingGuard le fait déjà).
//      Rendre null évite une navigation simultanée contradictoire.
//
//  RÈGLE D'OR :
//    Mode multi  → Guard redirige vers /login,  Navbar rend null
//    Mode single → Guard silencieux,             Navbar redirige vers /login
// =============================================================================
const Navbar: React.FC = () => {
  const session = useSession();
  const tenantMode = useTenantMode();
  const egenSpaBase = window['getEgenSpaBase']();

  const currentReferrer = window.location.pathname.slice(
    window.location.pathname.indexOf(egenSpaBase) + egenSpaBase.length - 1,
  );

  // ── Utilisateur connecté → rendre le Header (tous modes) ───────────────
  if (session?.authenticated && session?.user?.person) {
    return <HeaderContainer render={HeaderItems} />;
  }

  // ── Non connecté, mode MULTI → Guard gère la redirection ───────────────
  // Le TenantRoutingGuard a déjà (ou va) émettre navigate({ to: '/login?tenant=...' }).
  // On retourne null pour éviter deux navigate() simultanés contradictoires.
  if (tenantMode === 'multi') {
    return null;
  }

  // ── Non connecté, mode SINGLE / OFF → Navbar gère la redirection ───────
  // Le Guard est silencieux (skip) dans ces modes. C'est la Navbar qui
  // assure le rôle de garde d'authentification.
  return (
    <Navigate
      to="/login"
      state={{ referrer: currentReferrer }}
    />
  );
};

export default Navbar;
