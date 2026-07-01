import React, { useCallback, useState , useMemo} from 'react';
import { useTranslation } from 'react-i18next';
import { Navigate } from 'react-router-dom';
import {
  ConfigurableLink,
  ExtensionSlot,
  useAssignedExtensions,
  useConfig,
  useLayoutType,
  useLeftNavStore,
  useSession,
} from '@egen/esm-framework';
import { useTenantMode } from '@egen/esm-tenant';
import { isDesktop } from '../../utils';
import Logo from '../logo/logo.component';
import ContextSwitcher from './context-switcher/context-switcher.component';
import SearchBar from './search-bar/search-bar.component';
import BreadcrumbNav from './breadcrumb/breadcrumb.component';
import AppMenuButton from './app-menu-button.component';
import UserMenuButton from './user-menu-button.component';
import NotificationsMenuPanel from '../navbar-header-panels/notifications-menu-panel.component';
import SideMenuPanel from '../navbar-header-panels/side-menu-panel.component';
import styles from './navbar.scss';

// =============================================================================
//  HEADER ITEMS — Contenu du niveau 1 de la topbar
//
//  Layout (space-between) :
//
//  [LEFT]  ContextSwitcher  |  Logo
//  [MID]   ExtensionSlot top-nav-info-slot  (slot libre, invisible si vide)
//  [RIGHT] SearchBar  ·  top-nav-actions-slot  ·  Notifications  ·  User  ·  Apps
//
//  Deux niveaux empilés verticalement :
//    Niveau 1 : cette barre principale
//    Niveau 2 : BreadcrumbNav (fil d'Ariane, invisible si slot vide)
// =============================================================================

const HeaderItems: React.FC = () => {
  const { t } = useTranslation();
  const config = useConfig();
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
    // Wrapper à deux niveaux
    <div className={styles.topNavWrapper}>
      {/* ══ NIVEAU 1 — Barre principale ══════════════════════════════════════ */}
      <Header aria-label={t('primaryNavigation', 'Navigation principale EIGEN')} className={styles.topNavHeader}>
        {/* ── LEFT : hamburger + context switcher + séparateur + logo ── */}
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

          {/* Context Switcher (visible uniquement en mode multi-tenant) */}
          <ContextSwitcher />

          {/* Séparateur vertical */}
          <div className={styles.divider} aria-hidden="true" />

          {/* Logo cliquable → /home du SPA */}
          <ConfigurableLink to={config.logo?.link ?? '${egenSpaBase}/home'} className={styles.logoLink}>
            <Logo />
          </ConfigurableLink>
        </div>

        {/* ── CENTRE : slot libre pour injections par les apps ── */}
        {/*   Invisible si aucune extension n'y est rattachée.     */}
        <div className={styles.centerSection}>
          <ExtensionSlot name="top-nav-info-slot" className={styles.topNavInfoSlot} />
        </div>

        {/* ── RIGHT : search + actions + notifications + user + apps ── */}
        <HeaderGlobalBar className={styles.rightSection}>
          {/* Barre de recherche animée */}
          <SearchBar />

          {/* Actions injectables (ex: bouton aide, raccourcis) */}
          <ExtensionSlot
            name="top-nav-actions-slot"
            state={{ isActivePanel, togglePanel, hidePanel }}
            className={styles.topNavActionsSlot}
          />

          {/* Notifications */}
          <ExtensionSlot name="notifications-menu-button-slot" state={{ isActivePanel, togglePanel }} />

          {/* Utilisateur connecté */}
          <UserMenuButton isActivePanel={isActivePanel} togglePanel={togglePanel} hidePanel={hidePanel} />

          {/* Applications */}
          <AppMenuButton isActivePanel={isActivePanel} togglePanel={togglePanel} hidePanel={hidePanel} />

          {/* Aide (slot extensible) */}
          <ExtensionSlot
            name="top-nav-app-menu-slot"
            state={{ isActivePanel, togglePanel, hidePanel }}
            className={styles.topNavActionsSlot}
          />
        </HeaderGlobalBar>

        {/* ── Panneaux slides (side menu + notifications) ── */}
        <SideMenuPanel hidePanel={hidePanel('sideMenu')} expanded={isActivePanel('sideMenu')} />
        <NotificationsMenuPanel expanded={isActivePanel('notificationsMenu')} />
      </Header>

      {/* ══ NIVEAU 2 — Fil d'Ariane (breadcrumb) ═════════════════════════════
           Invisible si le slot "top-nav-breadcrumb-slot" n'a aucune extension.
           Chaque app monte ses éléments de breadcrumb dans ce slot.          */}
      <BreadcrumbNav />
    </div>
  );
};

// =============================================================================
//  NAVBAR — Barre de navigation des espaces tenant authentifiés
//
//  RESPONSABILITÉ :
//    • Rend le Carbon Header EGEN quand l'utilisateur est connecté.
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

  // Connecté → rendre la topbar complète (tous modes)
  if (session?.authenticated && session?.user?.person) {
    return <HeaderContainer render={HeaderItems} />;
  }

  // Non connecté, mode multi → Guard TenantRoutingGuard gère la redirection
  if (tenantMode === 'multi') {
    return null;
  }

  // ── Non connecté, mode SINGLE / OFF → Navbar gère la redirection ───────
  // Le Guard est silencieux (skip) dans ces modes. C'est la Navbar qui
  // assure le rôle de garde d'authentification.
  return <Navigate to="/login" state={{ referrer: currentReferrer }} />;
};

export default Navbar;
