import React, { useCallback } from 'react';
import { ExtensionSlot, useAssignedExtensions } from '@egen-civitas/esm-framework';
import { BreadcrumbLevel2Nav } from '../navigation/BreadcrumbLevel2Nav';
import { useActiveAppModules } from '../../hooks/useActiveAppModules';
import { DropdownNavigation, type NavItem } from './DropdownNavigation';
import optionStyles from '../options/topbar-options.scss';

// =============================================================================
//  TOPBAR — NIVEAU 2 (barre d'outils de l'application active)
//
//  Design « barre d'outils d'IDE » : une rangée compacte de widgets (survol arrondi), découpée en
//  trois zones aux rôles distincts. La barre est TOUJOURS transparente et sans bordure : elle se
//  fond avec le niveau 1 et avec les rails du plan de travail (aucune ligne, aucune rupture) :
//
//   ┌──────────────┬─────────────────────────────────────────┬─────────────┐
//   │ ZONE APP     │ ZONE NAVIGATION                          │ ZONE FIN    │
//   │ top-nav-app- │ options de navigation (menu de l'accueil │ top-nav-    │
//   │ slot         │ ou fil d'Ariane) + slots historiques     │ level2-end- │
//   │ (app active) │                                          │ slot        │
//   └──────────────┴─────────────────────────────────────────┴─────────────┘
//
//  • ZONE APP — `top-nav-app-slot` : n'affiche QUE les extensions de l'app dont une page est
//    montée (logo, nom, actions propres à l'app…). Quitter l'app retire son contenu ; le
//    code des apps inactives n'est même pas chargé.
//  • ZONE NAVIGATION — inchangée : menu déroulant (accueil / « Mode Fil d'ariane ») ou fil
//    d'Ariane, plus `top-nav-level2-start-slot` et `top-nav-breadcrumb-slot` (historiques).
//  • ZONE FIN — `top-nav-level2-end-slot` : réservée aux contributions globales (assistant IA).
// =============================================================================

/** Slot du contenu de barre d'outils de l'app active (niveau 2, à gauche de la navigation). */
export const TOP_NAV_APP_SLOT = 'top-nav-app-slot';

interface TopBarLevel2Props {
  /** `true` sur l'accueil : la navigation s'affiche sous forme de menu déroulant. */
  isHome: boolean;
  /** `true` quand l'utilisateur a demandé le menu déroulant hors accueil. */
  showFullNav: boolean;
  onShowFullNav: () => void;
  onHideFullNav: () => void;
  /** Entrées du menu déroulant (déjà liées au comportement de navigation). */
  navItems: NavItem[];
  /** État transmis à toutes les extensions (`isActivePanel`, `togglePanel`, `hidePanel`). */
  slotState: Record<string, unknown>;
}

export function TopBarLevel2({
  isHome,
  showFullNav,
  onShowFullNav,
  onHideFullNav,
  navItems,
  slotState,
}: TopBarLevel2Props) {
  const activeModules = useActiveAppModules();
  const assigned = useAssignedExtensions(TOP_NAV_APP_SLOT);

  // Seules les extensions d'une app active sont rendues (et donc chargées).
  const selectActiveApps = useCallback(
    <T extends { moduleName: string }>(extensions: T[]) => extensions.filter((e) => activeModules.has(e.moduleName)),
    [activeModules],
  );
  const hasAppContent = assigned.some((extension) => activeModules.has(extension.moduleName));
  const showDropdown = isHome || showFullNav;

  return (
    <div
      role="toolbar"
      aria-label="Barre d'outils de l'application"
      data-slot="topbar-level2"
      className="relative z-30 flex h-10 w-full items-center gap-1 bg-transparent px-2 sm:h-11 sm:px-4 md:px-6 lg:px-7"
    >
      {/* ZONE APP — contenu déclaré par l'app active */}
      <ExtensionSlot
        name={TOP_NAV_APP_SLOT}
        state={slotState}
        select={selectActiveApps}
        data-slot="topbar-app"
        className={hasAppContent ? 'flex shrink-0 items-center gap-1' : 'hidden'}
      />
      {hasAppContent && (
        <span aria-hidden="true" data-testid="topbar-app-divider" className="mx-1 h-5 w-px shrink-0 bg-white/10" />
      )}

      {/* ZONE NAVIGATION — options de navigation (inchangées) */}
      <div data-slot="topbar-nav" className="flex min-w-0 flex-1 items-center justify-between gap-2">
        {showDropdown ? (
          <>
            <ExtensionSlot name="top-nav-level2-start-slot" state={slotState} className="flex shrink-0 items-center" />
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
          <div className="flex min-w-0 items-center gap-3">
            <ExtensionSlot name="top-nav-level2-start-slot" state={slotState} className="flex shrink-0 items-center" />
            <BreadcrumbLevel2Nav onToggleFullMenu={onShowFullNav} />
            {/* Fil d'Ariane par extensions (invisible si aucune extension) */}
            <ExtensionSlot name="top-nav-breadcrumb-slot" className={optionStyles.breadcrumbSlot} />
          </div>
        )}
      </div>

      {/* ZONE FIN — contributions globales (ex. assistant IA) */}
      <ExtensionSlot
        name="top-nav-level2-end-slot"
        state={slotState}
        data-slot="topbar-end"
        className="flex shrink-0 items-center"
      />
    </div>
  );
}
