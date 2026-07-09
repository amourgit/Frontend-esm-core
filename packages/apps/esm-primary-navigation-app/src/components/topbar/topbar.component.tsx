import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Navigate } from 'react-router-dom';
import { Header, HeaderContainer, HeaderGlobalBar, HeaderMenuButton } from '@carbon/react';
import { ConfigurableLink, ExtensionSlot, useAssignedExtensions, useConfig, useLayoutType, useLeftNavStore, useSession } from '@egen/esm-framework';
import { useTenantMode } from '@egen/esm-tenant';
import { isDesktop } from '../../utils';
import { type ConfigSchema } from '../../config-schema';
import Logo from '../logo/logo.component';
import ContextSwitcher from '../context-switcher/context-switcher.component';
import SearchBar from '../search-bar/search-bar.component';
import BreadcrumbNav from '../breadcrumb/breadcrumb.component';
import AppsMenuButton from '../apps-menu/apps-menu-button.component';
import NotificationsMenuButton from '../notifications-menu/notifications-menu-button.component';
import UserMenuButton from '../user-menu/user-menu-button.component';
import SideMenuPanel from '../side-menu/side-menu-panel.component';
import styles from './topbar.scss';

// =============================================================================
//  TOPBAR — Barre de navigation principale EGEN (design recodé de zéro)
//
//  Layout (space-between), deux niveaux empilés verticalement :
//
//  Niveau 1 :
//    [LEFT]   Hamburger (mobile) · ContextSwitcher · séparateur · Logo
//    [CENTER] ExtensionSlot top-nav-info-slot (invisible si vide)
//    [RIGHT]  SearchBar · top-nav-actions-slot · Notifications · User · Apps
//  Niveau 2 :
//    BreadcrumbNav (invisible si aucune extension n'y est rattachée)
// =============================================================================

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

  return (
    <div className={styles.topBarWrapper}>
      {/* ══ NIVEAU 1 — Barre principale ══════════════════════════════════ */}
      <Header aria-label={t('primaryNavigation', 'Navigation principale EGEN')} className={styles.topBarHeader}>
        {/* ── LEFT ── */}
        <div className={styles.leftSection}>
          {showHamburger && (
            <HeaderMenuButton
              aria-label={t('openMenu', 'Ouvrir le menu')}
              isCollapsible
              className={styles.headerMenuButton}
              onClick={() => togglePanel('sideMenu')}
              onMouseDown={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
              isActive={isActivePanel('sideMenu')}
            />
          )}

          <ContextSwitcher />

          <div className={styles.divider} aria-hidden="true" />

          <ConfigurableLink to={config.logo?.link ?? '${egenSpaBase}/home'} className={styles.logoLink}>
            <Logo />
          </ConfigurableLink>
        </div>

        {/* ── CENTRE — slot libre pour injections par les apps ── */}
        <div className={styles.centerSection}>
          <ExtensionSlot name="top-nav-info-slot" className={styles.topNavInfoSlot} />
        </div>

        {/* ── RIGHT ── */}
        <HeaderGlobalBar className={styles.rightSection}>
          <SearchBar />

          <ExtensionSlot
            name="top-nav-actions-slot"
            state={{ isActivePanel, togglePanel, hidePanel }}
            className={styles.topNavActionsSlot}
          />

          <NotificationsMenuButton isActivePanel={isActivePanel} togglePanel={togglePanel} hidePanel={hidePanel} />
          <UserMenuButton isActivePanel={isActivePanel} togglePanel={togglePanel} hidePanel={hidePanel} />
          <AppsMenuButton isActivePanel={isActivePanel} togglePanel={togglePanel} hidePanel={hidePanel} />

          <ExtensionSlot
            name="top-nav-app-menu-slot"
            state={{ isActivePanel, togglePanel, hidePanel }}
            className={styles.topNavActionsSlot}
          />
        </HeaderGlobalBar>

        <SideMenuPanel hidePanel={hidePanel('sideMenu')} expanded={isActivePanel('sideMenu')} />
      </Header>

      {/* ══ NIVEAU 2 — Fil d'Ariane ═══════════════════════════════════════ */}
      <BreadcrumbNav />
    </div>
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
    return <HeaderContainer render={TopBarContent} />;
  }

  // Non connecté, mode multi → Guard TenantRoutingGuard gère la redirection
  if (tenantMode === 'multi') {
    return null;
  }

  // Non connecté, mode SINGLE / OFF → TopBar gère la redirection
  return <Navigate to="/login" state={{ referrer: currentReferrer }} />;
};

export default TopBar;
