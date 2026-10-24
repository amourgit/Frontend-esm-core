import React, { useState, useRef, useEffect } from 'react';
import {
  Search,
  ChevronDown,
  ChevronRight,
  Home,
  CirclePlus,
  Settings,
  LayoutGrid,
  Globe,
  Check,
  ExternalLink,
  FileText,
  Users,
  Building2,
  Leaf,
  Briefcase,
  FolderOpen,
  Calendar,
  Layers,
  Sparkles,
  MessageSquare,
  Mail,
  Cloud,
  X,
  Menu,
  Star,
  Zap,
  ShieldCheck,
  User,
  SlidersHorizontal,
  Bookmark,
  Radio,
  Lock,
  Compass,
  PanelLeft,
  PanelLeftClose,
  Bell,
  Scan,
  CheckSquare,
  GitFork,
  Plus,
  LogOut,
  Grid,
  Newspaper,
  Megaphone,
  BarChart3,
  Database,
  AppWindow,
  Info,
  Server,
  Bot,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useLocation, useNavigate } from 'react-router-dom';
import { DropdownNavigation, type NavItem } from './DropdownNavigation';
import { TopBarLevel2 } from './TopBarLevel2';
import { bindNavSelection } from '../../utils/navSelection';
import { playXboxSound } from '../../utils/xboxAudio';
import { useWorkspace } from '../../context/WorkspaceContext';
import { EgenLogo } from '../ui/EgenLogo';
import { WorkspaceAndSiteSelectorsColumn } from './WorkspaceAndSiteSelectorsColumn';
import { GooeyInput } from '../ui/GooeyInput';
import { WaterGlassModal } from '../ui/WaterGlassModal';
import { ExtensionSlot, interpolateUrl, navigate as frameworkNavigate, useConfig } from '@egen-civitas/esm-framework';
import { type ConfigSchema } from '../../../config-schema';
import {
  AppsMenuOption,
  FullscreenOption,
  LanguageOption,
  NotificationsOption,
  QuickAccessOption,
  ThemeToggleOption,
  UserMenuOption,
} from '../options';

/** Chemins considérés comme "accueil" (le core sert l'accueil sur /home ; les autres sont des alias GED). */
const HOME_PATHS = ['/', '/home', '/accueil'];

export interface SupremeIntranetTopBarProps {
  // Global Intranet Props (Level 1)
  onOpenGlobalSearch?: () => void;
  onOpenGED?: () => void;
  currentAppName?: string;
  onShowNotification?: (msg: string, type?: 'success' | 'info' | 'warning' | 'error') => void;

  // Extensible Application Tier Props (Level 2)
  onToggleSidebar?: () => void;
  isSidebarOpen?: boolean;
  onSearchClick?: () => void;
  onNotificationClick?: () => void;
  onQuickAction?: (actionName: string) => void;

  // Menus GED (maquettes, sans service réel dans le core) — masqués par défaut
  showCreateMenu?: boolean;
  showSettingsMenu?: boolean;
}

export function SupremeIntranetTopBar({
  onOpenGlobalSearch,
  onOpenGED,
  currentAppName = 'EGEN GED Documents',
  onShowNotification,
  onToggleSidebar,
  isSidebarOpen = false,
  onSearchClick,
  onNotificationClick,
  onQuickAction,
  showCreateMenu = false,
  showSettingsMenu = false,
}: SupremeIntranetTopBarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const config = useConfig<ConfigSchema>();
  const currentPath = location.pathname.replace(/\/+$/, '') || '/';
  const isHome = HOME_PATHS.includes(currentPath);
  const { currentWorkspace, availableWorkspaces, currentApps } = useWorkspace();

  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [expandedMobileCategory, setExpandedMobileCategory] = useState<string | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFullNav, setShowFullNav] = useState(false);
  const [timeStr, setTimeStr] = useState('10:50');
  const [dateLongStr, setDateLongStr] = useState('');
  const menuRef = useRef<HTMLDivElement>(null);

  // Live time ticker & long date for App Tier
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      let hours = now.getHours();
      const mins = String(now.getMinutes()).padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const displayHours = hours % 12 || 12;
      setTimeStr(`${displayHours}:${mins} ${ampm}`);

      const formattedDate = now.toLocaleDateString('fr-FR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
      setDateLongStr(formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1));
    };

    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, []);

  // Auto switch to Breadcrumb navigation mode when navigating away from Home
  useEffect(() => {
    if (!isHome) {
      setShowFullNav(false);
    }
  }, [isHome]);

  // Determine current active route in GED
  const currentAppRoute = React.useMemo(() => {
    const path = location.pathname;
    if (HOME_PATHS.includes(path)) return 'accueil';
    if (
      path.startsWith('/ged/documentation') ||
      path.startsWith('/documentation') ||
      path === '/salles' ||
      path === '/documents' ||
      path.startsWith('/salle') ||
      path.startsWith('/rayon') ||
      path.startsWith('/casier') ||
      path.startsWith('/dossier')
    )
      return 'documentation';
    if (path === '/ged/ingestion' || path === '/ingestion') return 'ingestion';
    if (path === '/ged/sites' || path === '/espaces') return 'espaces';
    if (path === '/taches') return 'taches';
    if (path === '/workflows') return 'workflows';
    return 'accueil';
  }, [location.pathname]);

  // Close dropdowns on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActiveMenu(null);
        setIsSearchOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Prevent background scroll when mobile drawer is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

  const handleMenuClick = (menuName: string) => {
    playXboxSound('toggle');
    setActiveMenu((prev) => (prev === menuName ? null : menuName));
  };

  // Adaptateurs de panneaux (contrat des slots d'extension top-nav-*)
  const isActivePanel = (panelName: string) => activeMenu === panelName;
  const hidePanel = (panelName: string) => () => setActiveMenu((prev) => (prev === panelName ? null : prev));
  const slotState = { isActivePanel, togglePanel: handleMenuClick, hidePanel };
  const hideOnSearch = isSearchOpen ? 'hidden lg:flex' : '';

  const toggleMobileCategory = (cat: string) => {
    playXboxSound('toggle');
    setExpandedMobileCategory((prev) => (prev === cat ? null : cat));
  };

  const notify = (msg: string) => {
    playXboxSound('select');
    if (onShowNotification) {
      onShowNotification(msg, 'info');
    }
  };

  const desktopNavItems = React.useMemo<NavItem[]>(() => {
    // Niveau 2 : arborescence déclarée par les apps (slot), reliée à la logique de clic — la logique
    // globale (son, fermeture du menu, navigation) sauf si l'app a déclaré son propre comportement.
    const baseNavItems = bindNavSelection(currentWorkspace.navItems || [], {
      workspaceId: currentWorkspace.id,
      runDefault: (route) => {
        playXboxSound('select');
        setShowFullNav(false);
        if (route) navigate(`/${route}`);
      },
    });

    return baseNavItems;
  }, [currentWorkspace, navigate, setShowFullNav]);

  // Group workspaces by category
  const workspaceGroups = React.useMemo(() => {
    const categories: { key: string; label: string; items: typeof availableWorkspaces }[] = [
      {
        key: 'public',
        label: 'Espaces Publique',
        items: availableWorkspaces.filter((ws) => ws.category === 'public'),
      },
      {
        key: 'organisationnel',
        label: 'Espace Organisationnel',
        items: availableWorkspaces.filter((ws) => ws.category === 'organisationnel'),
      },
      {
        key: 'personnel',
        label: 'Espace Personnel',
        items: availableWorkspaces.filter((ws) => ws.category === 'personnel'),
      },
    ];
    return categories.filter((cat) => cat.items.length > 0);
  }, [availableWorkspaces]);

  return (
    <div
      ref={menuRef}
      className="w-full shrink-0 z-50 select-none relative font-sans text-slate-100 overflow-visible border-b border-white/10 bg-transparent"
    >
      {/* 1. SUPREME TOPBAR: EXACT POWELL SOFTWARE LIGHT INTRANET TOPBAR */}
      <header className="w-full bg-transparent transition-colors overflow-visible flex flex-col">
        {/* ROW 1: BRAND & ACTIONS TOP ROW */}
        <div className="w-full px-2 sm:px-4 md:px-6 lg:px-7 h-11 sm:h-12 flex items-center justify-between gap-1.5 sm:gap-2">
          {/* LEFT SECTION: Logo & Brand + Workspace & Service Selectors Parent Column */}
          <div
            className={`items-center gap-1 sm:gap-2 md:gap-3 lg:gap-4 h-full min-w-0 flex-1 sm:flex-initial overflow-visible ${
              isSearchOpen ? 'hidden lg:flex' : 'flex'
            }`}
          >
            {/* EGEN Official Logo & Brand */}
            <div
              onClick={() => {
                playXboxSound('select');
                navigate('/home');
              }}
              className="flex items-center cursor-pointer shrink-0 py-0.5 group overflow-visible hover:opacity-95 transition-opacity"
              title="EGEN — Écosystème Gouvernemental de l’Économie Numérique"
            >
              {/* Un seul logo : la taille responsive est portée par EgenLogo (size="nav"). */}
              <EgenLogo size="nav" variant="full" />
            </div>

            {/* PARENT COMPONENT: WORKSPACE & SITE SELECTORS IN COLUMN */}
            <WorkspaceAndSiteSelectorsColumn onShowNotification={onShowNotification} />
          </div>

          {/* CENTER: point d'extension d'information (invisible si aucune extension) */}
          <div className="hidden lg:flex flex-1 min-w-0 items-center justify-center px-2">
            <ExtensionSlot name="top-nav-info-slot" className="flex items-center gap-2 truncate text-xs opacity-70" />
          </div>

          {/* RIGHT SECTION: Minimal Dimension Buttons without background (Free text/icons) */}
          <div
            className={`items-center gap-1 sm:gap-2 lg:gap-3.5 overflow-visible ${
              isSearchOpen
                ? 'w-full flex justify-between items-center lg:w-auto lg:shrink-0 lg:justify-end'
                : 'flex shrink-0'
            }`}
          >
            {/* 1. Search Gooey Input with fluid liquid spring physics */}
            <div
              className={`relative overflow-visible flex items-center justify-start ${
                isSearchOpen ? 'flex-1 lg:flex-initial' : ''
              }`}
            >
              <GooeyInput
                placeholder="Rechercher..."
                collapsedWidth={115}
                expandedWidth={220}
                expandedOffset={40}
                value={searchQuery}
                onValueChange={setSearchQuery}
                expanded={isSearchOpen}
                onOpenChange={setIsSearchOpen}
                onClick={() => {
                  playXboxSound('toggle');
                  setActiveMenu(null);
                  setIsMobileMenuOpen(false);
                }}
                onSubmit={(val) => {
                  const query = val.trim();
                  if (!query) return;
                  frameworkNavigate({ to: `${interpolateUrl(config.search.path)}?q=${encodeURIComponent(query)}` });
                  if (onOpenGlobalSearch) onOpenGlobalSearch();
                }}
              />
            </div>

            {/* Mobile/Tablet Cancel Button when Search is expanded */}
            {isSearchOpen && (
              <button
                type="button"
                onClick={() => {
                  playXboxSound('toggle');
                  setSearchQuery('');
                  setIsSearchOpen(false);
                }}
                className="lg:hidden text-xs text-teal-300 hover:text-white font-semibold px-3.5 py-1.5 rounded-full backdrop-blur-md bg-white/[0.08] hover:bg-white/[0.16] border border-white/20 hover:border-teal-400/40 shadow-[inset_0_1px_1px_rgba(255,255,255,0.25),0_2px_8px_rgba(0,0,0,0.08)] transition-all cursor-pointer shrink-0 whitespace-nowrap active:scale-95"
                title="Annuler la recherche"
              >
                Annuler
              </button>
            )}

            {/* 2. Langue — service réel (change-language-modal) */}
            <LanguageOption className={hideOnSearch} />

            {/* 3. Separator Line */}
            <div
              className={`${isSearchOpen ? 'hidden lg:block' : 'hidden sm:block'} h-4 sm:h-4.5 w-px bg-white/20 mx-0.5`}
            />

            {/* 3. Lanceur d'applications — service réel (app-menu-slot + liens externes) */}
            <AppsMenuOption
              open={activeMenu === 'appMenu'}
              onToggle={() => handleMenuClick('appMenu')}
              className={hideOnSearch}
            />

            {/* 4. Raccourcis — service réel (quick-access-slot) */}
            <QuickAccessOption
              open={activeMenu === 'quickAccess'}
              onToggle={() => handleMenuClick('quickAccess')}
              className={hideOnSearch}
            />

            {/* 5. Notifications — service réel (notifications-nav-menu-slot) */}
            <NotificationsOption
              open={activeMenu === 'notificationsMenu'}
              onToggle={() => handleMenuClick('notificationsMenu')}
              className={hideOnSearch}
            />

            {showCreateMenu && (
              <>
                {/* 5. Plus / Create Icon */}
                <div className={`relative overflow-visible ${isSearchOpen ? 'hidden lg:flex' : 'hidden xs:flex'}`}>
                  <button
                    type="button"
                    onClick={() => handleMenuClick('create')}
                    className="p-1 text-teal-400 hover:text-teal-300 transition-colors cursor-pointer bg-transparent border-none flex items-center justify-center overflow-visible"
                    title="Créer un nouveau contenu ou document"
                    aria-label="Créer"
                  >
                    <CirclePlus className="w-4.5 h-4.5 sm:w-5 sm:h-5 stroke-[1.8]" />
                  </button>

                  {/* Create Dropdown via WaterGlassModal */}
                  {activeMenu === 'create' && (
                    <WaterGlassModal
                      align="none"
                      className="fixed sm:absolute top-14 sm:top-10 left-2 right-2 sm:left-auto sm:right-0 w-[calc(100vw-16px)] sm:w-56 max-w-xs z-[9999]"
                      header={
                        <span className="text-[10px] font-bold text-teal-300 uppercase tracking-wider">
                          Nouveau contenu
                        </span>
                      }
                      optionsComponent={
                        <div className="space-y-1">
                          <button
                            onClick={() => {
                              setActiveMenu(null);
                              notify('Création de nouveau dossier GED');
                            }}
                            className="w-full text-left px-3 py-2 rounded-xl text-slate-200/90 hover:bg-white/[0.06] hover:text-white flex items-center gap-2.5 transition-all duration-200 cursor-pointer border-none text-[11px]"
                          >
                            <FolderOpen className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Nouveau Dossier GED</span>
                          </button>
                          <button
                            onClick={() => {
                              setActiveMenu(null);
                              notify('Téléversement de fichier');
                            }}
                            className="w-full text-left px-3 py-2 rounded-xl text-slate-200/90 hover:bg-white/[0.06] hover:text-white flex items-center gap-2.5 transition-all duration-200 cursor-pointer border-none text-[11px]"
                          >
                            <FileText className="w-3.5 h-3.5 text-cyan-400" />
                            <span>Importer un Document</span>
                          </button>
                          <button
                            onClick={() => {
                              setActiveMenu(null);
                              notify('Nouvelle publication sur My Board');
                            }}
                            className="w-full text-left px-3 py-2 rounded-xl text-slate-200/90 hover:bg-white/[0.06] hover:text-white flex items-center gap-2.5 transition-all duration-200 cursor-pointer border-none text-[11px]"
                          >
                            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                            <span>Nouvelle Publication</span>
                          </button>
                        </div>
                      }
                    />
                  )}
                </div>
              </>
            )}

            {showSettingsMenu && (
              <>
                {/* 6. Settings Gear Icon */}
                <div className={`relative overflow-visible ${isSearchOpen ? 'hidden lg:flex' : 'hidden sm:flex'}`}>
                  <button
                    type="button"
                    onClick={() => handleMenuClick('settings')}
                    className="p-1 text-slate-300 hover:text-teal-400 transition-colors cursor-pointer bg-transparent border-none flex items-center justify-center overflow-visible"
                    title="Paramètres de l'intranet"
                    aria-label="Paramètres"
                  >
                    <Settings className="w-4 h-4 sm:w-4.5 sm:h-4.5 stroke-[1.8]" />
                  </button>

                  {/* Settings Dropdown via WaterGlassModal */}
                  {activeMenu === 'settings' && (
                    <WaterGlassModal
                      align="right"
                      width="w-[calc(100vw-24px)] sm:w-52 max-w-xs"
                      header={
                        <span className="text-[10px] font-bold text-teal-300 uppercase tracking-wider">
                          Configuration
                        </span>
                      }
                      optionsComponent={
                        <div className="space-y-1">
                          <button
                            onClick={() => {
                              setActiveMenu(null);
                              notify("Préférences d'affichage");
                            }}
                            className="w-full text-left px-3 py-2 rounded-xl text-slate-200/90 hover:bg-white/[0.06] hover:text-white cursor-pointer border-none text-[11px] transition-all"
                          >
                            Préférences d'affichage
                          </button>
                          <button
                            onClick={() => {
                              setActiveMenu(null);
                              notify('Paramètres de sécurité & accès');
                            }}
                            className="w-full text-left px-3 py-2 rounded-xl text-slate-200/90 hover:bg-white/[0.06] hover:text-white cursor-pointer border-none text-[11px] transition-all"
                          >
                            Permissions & Sécurité
                          </button>
                          <button
                            onClick={() => {
                              setActiveMenu(null);
                              notify("À propos d'EGEN v4.2 — Écosystème Gouvernemental");
                            }}
                            className="w-full text-left px-3 py-2 rounded-xl text-slate-200/90 hover:bg-white/[0.06] hover:text-white cursor-pointer border-none text-[11px] transition-all"
                          >
                            À propos d'EGEN
                          </button>
                        </div>
                      }
                    />
                  )}
                </div>
              </>
            )}

            {/* 6. Plein écran & 7. Thème — services réels */}
            <FullscreenOption className={hideOnSearch} />
            <ThemeToggleOption className={hideOnSearch} />

            {/* 8. Extensions d'actions (slot ouvert aux autres apps) */}
            <ExtensionSlot name="top-nav-actions-slot" state={slotState} className="flex items-center" />

            {/* 9. Profil utilisateur — session réelle + user-panel-slot */}
            <UserMenuOption
              open={activeMenu === 'userMenu'}
              onToggle={() => handleMenuClick('userMenu')}
              className={isSearchOpen ? 'hidden lg:flex' : 'flex'}
            />

            {/* 10. Extensions de fin de barre (après le menu utilisateur) */}
            <ExtensionSlot name="top-nav-trailing-slot" state={slotState} className="flex items-center" />

            {/* 8. Date & Heure - Retiré depuis la version tablette (uniquement visible sur desktop lg+) */}
            <div className="hidden lg:flex flex-col items-end justify-center text-right select-none pl-2 sm:pl-3 ml-0.5 sm:ml-1 border-l border-white/15 shrink-0">
              <span className="text-white font-bold text-xs sm:text-[13px] tracking-tight leading-none drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                {timeStr}
              </span>
              <span className="text-[10px] sm:text-[11px] text-white/50 font-normal tracking-tight leading-tight mt-0.5 capitalize whitespace-nowrap">
                {dateLongStr}
              </span>
            </div>
          </div>
        </div>

        {/* ROW 2 : NIVEAU 2 — barre d'outils de l'app active + options de navigation */}
        <TopBarLevel2
          isHome={isHome}
          showFullNav={showFullNav}
          onShowFullNav={() => setShowFullNav(true)}
          onHideFullNav={() => setShowFullNav(false)}
          navItems={desktopNavItems}
          slotState={slotState}
        />
      </header>

    </div>
  );
}
