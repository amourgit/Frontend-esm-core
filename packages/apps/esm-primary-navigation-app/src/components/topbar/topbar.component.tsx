import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Navigate } from 'react-router-dom';
import { Header, HeaderContainer, HeaderGlobalBar, HeaderMenuButton } from '@carbon/react';
import {
  ConfigurableLink,
  DynamicField,
  ExtensionSlot,
  MenuToggleButton,
  StaggeredMenuPanel,
  useAssignedExtensions,
  useConfig,
  useLayoutType,
  useLeftNavStore,
  useSession,
} from '@egen/esm-framework';
import { useTenantMode } from '@egen/esm-tenant';
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
import styles from './topbar.scss';

// =============================================================================
//  TOPBAR — Barre de navigation principale EGEN (design recodé de zéro)
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

const TopBarContent: React.FC = () => {
  const { t } = useTranslation();
  const config = useConfig<ConfigSchema>();
  const [activeHeaderPanel, setActiveHeaderPanel] = useState<string | null>(null);
  const layout = useLayoutType();
  const { slotName, mode } = useLeftNavStore();
  const navMenuItems = useAssignedExtensions(slotName);

  // ── DÉMO TEMPORAIRE — DynamicField (à retirer après validation visuelle) ──
  const [demoOutlinedValue, setDemoOutlinedValue] = useState('');
  const [demoFilledValue, setDemoFilledValue] = useState('');

  // ── DÉMO TEMPORAIRE — StaggeredMenuPanel / MenuToggleButton ────────────────
  // Le côté ('left' | 'right') vient de config.staggeredMenu.position
  // (packages/apps/esm-primary-navigation-app/src/config-schema.ts),
  // configurable par les intégrateurs sans toucher au code — comportement
  // dynamique demandé, plus de state local à part.
  const [staggeredMenuOpen, setStaggeredMenuOpen] = useState(false);
  const staggeredMenuPosition = config.staggeredMenu.position;
  const demoStaggeredItems = [
    { label: 'Accueil', ariaLabel: "Aller à l'accueil", link: '#' },
    { label: 'Applications', ariaLabel: 'Voir les applications', link: '#' },
    { label: 'Paramètres', ariaLabel: 'Ouvrir les paramètres', link: '#' },
  ];
  const demoStaggeredSocials = [
    { label: 'GitHub', link: 'https://github.com/amourgit' },
    { label: 'LinkedIn', link: 'https://linkedin.com' },
  ];

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

          <ConfigurableLink to={config.logo?.link ?? '${egenSpaBase}/home'} className={styles.logoLink}>
            <Logo />
          </ConfigurableLink>

          <SearchBar />

          <ContextSwitcher />
        </div>

        {/* ── CENTRE — slot libre pour injections par les apps ── */}
        <div className={styles.centerSection}>
          {/* ══ DÉMO TEMPORAIRE — DynamicField — À RETIRER après validation visuelle ══ */}
          <div className={styles.fieldsDemo}>
            <DynamicField
              variant="outlined"
              size="sm"
              label="Outlined"
              placeholder=" "
              value={demoOutlinedValue}
              onChange={setDemoOutlinedValue}
              className={styles.fieldsDemoItem}
            />
            <DynamicField
              variant="filled"
              size="sm"
              label="Filled"
              placeholder=" "
              value={demoFilledValue}
              onChange={setDemoFilledValue}
              className={styles.fieldsDemoItem}
            />
          </div>
          {/* ══ FIN DÉMO TEMPORAIRE ══════════════════════════════════════════ */}

          <ExtensionSlot name="top-nav-info-slot" className={styles.topNavInfoSlot} />
        </div>

        {/* ── RIGHT ── */}
        <HeaderGlobalBar className={styles.rightSection}>
          <AppsMenuButton isActivePanel={isActivePanel} togglePanel={togglePanel} hidePanel={hidePanel} />
          <LanguageButton />
          <QuickAccessButton />
          <FullscreenButton />
          <ThemeToggleButton />
          <NotificationsMenuButton isActivePanel={isActivePanel} togglePanel={togglePanel} hidePanel={hidePanel} />

          <ExtensionSlot
            name="top-nav-actions-slot"
            state={{ isActivePanel, togglePanel, hidePanel }}
            className={styles.topNavActionsSlot}
          />

          <div className={styles.rightDivider} aria-hidden="true" />

          {/* ══ DÉMO TEMPORAIRE — MenuToggleButton — À RETIRER après validation ══ */}
          <MenuToggleButton
            isOpen={staggeredMenuOpen}
            onToggle={() => setStaggeredMenuOpen((prev) => !prev)}
            menuButtonColor="var(--colors-surface-foreground)"
            openMenuButtonColor="var(--colors-surface-foreground)"
            changeMenuColorOnOpen
          />
          {/* ══ FIN DÉMO TEMPORAIRE ══════════════════════════════════════════ */}

          <UserMenuButton isActivePanel={isActivePanel} togglePanel={togglePanel} hidePanel={hidePanel} />

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

      {/* ══ DÉMO TEMPORAIRE — StaggeredMenuPanel — À RETIRER après validation ══
          position vient de config.staggeredMenu.position (config-schema.ts). */}
      <StaggeredMenuPanel
        isOpen={staggeredMenuOpen}
        onClose={() => setStaggeredMenuOpen(false)}
        position={staggeredMenuPosition}
        items={demoStaggeredItems}
        socialItems={demoStaggeredSocials}
        displaySocials
        displayItemNumbering
        colors={['var(--colors-secondary-300)', 'var(--colors-primary-600)']}
        accentColor="var(--colors-primary-600)"
        closeOnClickAway
      />
      {/* ══ FIN DÉMO TEMPORAIRE ══════════════════════════════════════════════ */}
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
