import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Switcher, SwitcherDivider } from '@carbon/react';
import { ExtensionSlot, useAssignedExtensions, useSession } from '@egen-civitas/esm-framework';
import { WaterGlassModal } from '../ui/WaterGlassModal';
import { OPTION_PANEL_CLASS, type OptionPanelProps } from './TopBarOptionButton';
import styles from './topbar-options.scss';

// Menu utilisateur — services réels : identité de la session + extensions
// "user-panel-slot" / "user-panel-bottom-slot" (déconnexion, langue, etc.).
// Les extensions sont des `SwitcherItem` Carbon → conservées dans un `Switcher`.

const UserMenuOption: React.FC<OptionPanelProps> = ({ open, onToggle, className = '' }) => {
  const { t } = useTranslation();
  const session = useSession();
  const topItems = useAssignedExtensions('user-panel-slot');
  const bottomItems = useAssignedExtensions('user-panel-bottom-slot');

  const displayName = session?.user?.person?.display ?? session?.user?.display ?? '';
  const systemId = session?.user?.systemId ?? session?.user?.username ?? '';
  const initial = useMemo(() => (displayName ? displayName.trim().charAt(0).toUpperCase() : '?'), [displayName]);

  if (topItems.length === 0 && bottomItems.length === 0) return null;

  return (
    <div className={`relative overflow-visible items-center shrink-0 ${className || 'flex'}`}>
      <button
        type="button"
        onClick={onToggle}
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
        <WaterGlassModal
          align="none"
          className={`${OPTION_PANEL_CLASS} w-[calc(100vw-16px)] sm:w-64 max-w-xs`}
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
        </WaterGlassModal>
      )}
    </div>
  );
};

export default UserMenuOption;
