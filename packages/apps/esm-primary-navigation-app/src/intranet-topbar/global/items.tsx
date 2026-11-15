import React, { useMemo } from 'react';
import { ExtensionSlot } from '@egen-civitas/esm-framework';
import { DropdownNavigation } from '../components/shell/DropdownNavigation';
import { BreadcrumbNav } from '../components/navigation/BreadcrumbNav';
import { TopBarMenuPanel } from '../components/shell/TopBarMenuPanel';
import { registerTopBarItem, useTopBarUi, type TopBarItem } from '../kit';
import { resolvePlacement, type GlobalItemId } from './placement';
import { useTopBarNav } from './NavContext';
import optionStyles from '../components/options/topbar-options.scss';
import styles from '../components/shell/topbar-global-items.scss';

// =============================================================================
//  ÉLÉMENTS GLOBAUX DE LA TOPBAR — indépendants de toute app métier
//
//  Panneau latéral et navigation (les autres éléments sont des extensions d'apps). Chacun s'enregistre dans une région du kit, là où l'indique
//  `placement.ts` (surchargeable par la config `topbar.placement`) : ce fichier ne connaît AUCUN niveau.
//  Une app peut les masquer ou les remplacer (voir kit/layout-store.ts) sans toucher à ce fichier.
//  « Implementer tools » n'est plus ici : c'est une option du rail droit (esm-implementer-tools-app).
// =============================================================================

const MenuPanelItem: React.FC = () => <TopBarMenuPanel />;

/** Slots qui précèdent la navigation : l'officiel puis l'historique (toujours honoré). */
const NAV_START_SLOTS = ['topbar-nav-start-slot'] as const;

/** Navigation : menu déroulant (accueil) ou fil d'Ariane, plus leurs slots. Se place dans la région choisie par `placement.ts`. */
const NavigationItem: React.FC = () => {
  const ui = useTopBarUi();
  const { isHome, showFullNav, onShowFullNav, onHideFullNav, navItems } = useTopBarNav();
  const dropdown = isHome || showFullNav;
  // Objet stable : un nouvel `state` à chaque rendu relancerait `updateExtensionSlotState` des slots.
  const state = useMemo(() => ({ ...ui }), [ui]);
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
              onClick={onHideFullNav}
              className="shrink-0 cursor-pointer rounded-lg bg-white/10 px-2 py-1 text-xs text-slate-300 transition-colors hover:bg-white/15 hover:text-white"
            >
              Mode Fil d'ariane
            </button>
          )}
        </>
      ) : (
        <div className="flex min-w-0 flex-1 items-center gap-3">
          {startSlots}
          <BreadcrumbNav onToggleFullMenu={onShowFullNav} />
          <ExtensionSlot name="top-nav-breadcrumb-slot" className={optionStyles.breadcrumbSlot} />
        </div>
      )}
    </div>
  );
};

type ItemDefinition = Omit<TopBarItem, 'placement' | 'id'> & { id: GlobalItemId };

/** Les éléments globaux, SANS placement : la région et l'ordre viennent de `placement.ts`. */
const GLOBAL_ITEMS: readonly ItemDefinition[] = [
  { id: 'menu-panel', component: MenuPanelItem, hideOnSearch: 'touch' },
  { id: 'nav', component: NavigationItem },
];

/**
 * Enregistre (ou ré-enregistre) les éléments globaux selon le placement : usine + surcharges `topbar.placement`.
 * Rappeler la fonction avec un autre placement déplace les éléments (un enregistrement remplace le précédent).
 */
export function registerGlobalTopBarItems(overrides?: Readonly<Record<string, unknown>>): void {
  const placement = resolvePlacement(overrides);
  for (const item of GLOBAL_ITEMS) {
    const { level, rank, region, order } = placement[item.id];
    registerTopBarItem({ ...item, placement: { level, rank, region, order } });
  }
}
