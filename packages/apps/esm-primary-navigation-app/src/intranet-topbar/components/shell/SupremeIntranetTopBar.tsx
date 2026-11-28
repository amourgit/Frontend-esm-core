import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useIsDesktop, useIsMobile } from '../../hooks/useMediaQuery';
import {
  COMPACT_SKIN,
  TopBarLevels,
  TopBarUiProvider,
  type LevelSkin,
  type SkinResolver,
  type TopBarUi,
} from '../../kit';
import { useConfig } from '@egen-civitas/esm-framework';
import { type ConfigSchema } from '../../../config-schema';
import styles from './topbar-skeleton.module.css';

/** Peau de la première rangée (celle qui porte le logo et la recherche) : rangée pleine, robuste en mobile. */
const FULL_SKIN: LevelSkin = {
  row: styles.row,
  left: styles.regionLeft,
  center: styles.regionCenter,
  right: styles.regionRight,
  rightFull: styles.regionRightFull,
  yieldLeftToSearch: true,
};

/** Habillage par POSITION dans la pile (première rangée / les autres), jamais par numéro de niveau. */
const skinFor: SkinResolver = ({ isFirst }) => (isFirst ? FULL_SKIN : COMPACT_SKIN);

// =============================================================================
//  TOPBAR — hôte
//
//  Ne contient AUCUN élément : il porte l'état d'interface partagé (panneau ouvert, recherche, taille d'écran),
//  la navigation, et délègue la pile de niveaux à <TopBarLevels> (chaque niveau = régions gauche / centre /
//  droite, identiques pour tous). Tout ce qui s'affiche vient d'extensions d'apps attachées au slot `topbar-slot`.
//  Contrat complet : kit/regions.ts (régions) et kit/layout-store.ts (personnalisation par une app).
// =============================================================================
export function SupremeIntranetTopBar() {
  const config = useConfig<ConfigSchema>();

  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const isMobile = useIsMobile();
  const isDesktop = useIsDesktop();
  const menuRef = useRef<HTMLDivElement>(null);

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

  return (
    <div
      ref={menuRef}
      className="w-full shrink-0 z-50 select-none relative font-sans text-(--foreground) overflow-visible bg-transparent"
    >
      <TopBarUiProvider value={ui}>
        <header className="w-full bg-transparent transition-colors overflow-visible flex flex-col">
          {/* Pile de niveaux (1…N) : nombre et contenu déduits des éléments, extensions et de `topbar.levels` */}
          <TopBarLevels config={config.topbar?.levels} dateRules={config.topbar?.announcements} skinFor={skinFor} />
        </header>
      </TopBarUiProvider>
    </div>
  );
}
