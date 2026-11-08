import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Switcher, SwitcherDivider } from '@carbon/react';
import { ExtensionSlot, useAssignedExtensions, useSession } from '@egen-civitas/esm-framework';
import { GlassPanel } from './glass-panel.component';
import styles from './user-menu.scss';

// =============================================================================
//  MENU UTILISATEUR — extension de la TopBar
//
//  Avatar (initiale du nom) qui ouvre un panneau : identité de la session + extensions des slots `user-panel-slot` et
//  `user-panel-bottom-slot` (déconnexion, langue…), que d'autres apps alimentent. Rien d'autre n'est affiché si aucune
//  extension n'y est attachée.
//
//  La TopBar passe à toute extension un `state` (reçu ici comme props) : ouverture exclusive des panneaux, recherche
//  ouverte, type d'écran. Monté hors d'une TopBar (props absentes), le menu gère lui-même son ouverture.
// =============================================================================

const PANEL_ID = 'userMenu';
const PANEL_CLASS = 'fixed sm:absolute top-14 sm:top-10 left-2 right-2 sm:left-auto sm:right-0 max-w-sm z-[9999]';

interface TopBarState {
  isActivePanel?: (panelId: string) => boolean;
  togglePanel?: (panelId: string) => void;
  searchOpen?: boolean;
  isDesktop?: boolean;
}

const UserMenu: React.FC<TopBarState> = ({ isActivePanel, togglePanel, searchOpen, isDesktop }) => {
  const { t } = useTranslation();
  const session = useSession();
  const topItems = useAssignedExtensions('user-panel-slot');
  const bottomItems = useAssignedExtensions('user-panel-bottom-slot');
  const [localOpen, setLocalOpen] = useState(false);

  const open = isActivePanel ? isActivePanel(PANEL_ID) : localOpen;
  const toggle = () => (togglePanel ? togglePanel(PANEL_ID) : setLocalOpen((value) => !value));

  const displayName = session?.user?.person?.display ?? session?.user?.display ?? '';
  const systemId = session?.user?.systemId ?? session?.user?.username ?? '';
  const initial = useMemo(() => (displayName ? displayName.trim().charAt(0).toUpperCase() : '?'), [displayName]);

  // Recherche ouverte sur un écran tactile : la place revient à la recherche.
  if (searchOpen && isDesktop === false) return null;
  if (topItems.length === 0 && bottomItems.length === 0) return null;

  return (
    <div className="relative overflow-visible items-center shrink-0 flex">
      <button
        type="button"
        onClick={toggle}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={t('userMenuTooltip', 'Mon compte : {{name}}', { name: displayName })}
        title={displayName}
        data-tutorial-target="user-settings"
        className={`w-5.5 h-5.5 sm:w-6 sm:h-6 rounded-full overflow-hidden border shadow-2xs shrink-0 ml-0.5 sm:ml-1 cursor-pointer transition-all duration-150 hover:ring-2 hover:ring-teal-400/30 flex items-center justify-center p-0 focus:outline-none aspect-square bg-linear-to-br from-teal-600 to-sky-600 text-white text-[10px] font-bold ${
          open ? 'border-teal-400 ring-2 ring-teal-400/30' : 'border-white/30 hover:border-teal-400'
        }`}
      >
        {initial}
      </button>

      {open && (
        <GlassPanel
          className={`${PANEL_CLASS} w-[calc(100vw-16px)] sm:w-64 max-w-xs`}
          contentClassName="p-2.5"
          header={
            <div className="flex items-center gap-2.5" role="menu" aria-label={t('userMenu', 'Menu utilisateur')}>
              <div className="relative w-9 h-9 rounded-full flex items-center justify-center shrink-0 bg-linear-to-br from-teal-600 to-sky-600 text-white text-sm font-bold border border-white/20 shadow-xs">
                {initial}
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-1 ring-slate-900" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-white text-xs truncate">{displayName}</p>
                {systemId && <p className="text-[10px] text-slate-300 truncate">{systemId}</p>}
              </div>
            </div>
          }
        >
          <Switcher className={styles.switcher} aria-label={t('userMenuOptions', 'Options du menu utilisateur')}>
            <ExtensionSlot className={styles.fullWidth} name="user-panel-slot" />
            <SwitcherDivider className={styles.divider} aria-hidden="true" />
            <ExtensionSlot className={styles.fullWidth} name="user-panel-bottom-slot" />
          </Switcher>
        </GlassPanel>
      )}
    </div>
  );
};

export default UserMenu;
