import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ExternalLink } from 'lucide-react';
import { ExtensionSlot, useAssignedExtensions, useConfig } from '@egen-civitas/esm-framework';
import { type ConfigSchema } from '../config-schema';
import { GlassPanel } from './glass-panel.component';
import { OptionButton } from './option-button.component';
import styles from './launcher.module.css';

// =============================================================================
//  LANCEUR D'APPLICATIONS — extension de la TopBar
//
//  Bouton en grille + panneau : extensions du slot `app-menu-slot` (chaque app y déclare sa tuile) et liens externes
//  de la configuration (`externalRefLinks`). Le badge reflète le nombre réel de tuiles ; sans tuile, rien ne s'affiche.
//
//  La TopBar passe à toute extension un `state` (reçu ici comme props). Monté hors d'une TopBar (props absentes), le
//  lanceur gère lui-même son ouverture.
// =============================================================================

const PANEL_ID = 'appMenu';
const PANEL_CLASS = 'fixed sm:absolute top-14 sm:top-10 left-2 right-2 sm:left-auto sm:right-0 max-w-sm z-[9999]';

interface TopBarState {
  isActivePanel?: (panelId: string) => boolean;
  togglePanel?: (panelId: string) => void;
  searchOpen?: boolean;
  isDesktop?: boolean;
  isMobile?: boolean;
}

const GridGlyph: React.FC = () => (
  <div className="w-4.5 h-4.5 sm:w-5 sm:h-5 flex flex-wrap gap-0.5 items-center justify-center p-0.5">
    {[0, 1, 2, 3].map((i) => (
      <div key={i} className="w-1.5 h-1.5 rounded-[2px] bg-current" />
    ))}
  </div>
);

const Launcher: React.FC<TopBarState> = ({ isActivePanel, togglePanel, searchOpen, isDesktop, isMobile }) => {
  const { t } = useTranslation();
  const config = useConfig<ConfigSchema>();
  const appMenuItems = useAssignedExtensions('app-menu-slot');
  const [localOpen, setLocalOpen] = useState(false);

  const externalLinks = config?.externalRefLinks ?? [];
  const total = appMenuItems.length + externalLinks.length;
  const open = isActivePanel ? isActivePanel(PANEL_ID) : localOpen;
  const toggle = () => (togglePanel ? togglePanel(PANEL_ID) : setLocalOpen((value) => !value));

  // Mobile : pas de lanceur ; recherche ouverte sur tactile : la place revient à la recherche.
  if (isMobile) return null;
  if (searchOpen && isDesktop === false) return null;
  if (total === 0) return null;

  return (
    <div className="relative overflow-visible items-center flex">
      <OptionButton
        label={t('AppMenuTooltip', 'Applications')}
        active={open}
        badge={total > 9 ? '9+' : total}
        onClick={toggle}
        icon={<GridGlyph />}
        className="text-(--primary-400) hover:text-(--primary-300)"
      />
      {open && (
        <GlassPanel
          className={`${PANEL_CLASS} w-[calc(100vw-16px)] sm:w-80`}
          contentClassName="p-3"
          header={
            <span className="font-semibold text-sm text-white tracking-tight">{t('applications', 'Applications')}</span>
          }
        >
          <div className={styles.grid} role="menu" aria-label={t('applications', 'Applications')}>
            <ExtensionSlot className={styles.gridSlot} name="app-menu-slot" />
            {externalLinks.map((link) => (
              <a
                key={link.redirect}
                target="_blank"
                rel="noopener noreferrer"
                href={link.redirect}
                className={styles.gridItem}
              >
                <span className={styles.gridItemIcon}>
                  <ExternalLink size={16} />
                </span>
                <span className={styles.gridItemLabel}>{t(link.title)}</span>
              </a>
            ))}
          </div>
        </GlassPanel>
      )}
    </div>
  );
};

export default Launcher;
