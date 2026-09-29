import React from 'react';
import { useTranslation } from 'react-i18next';
import { ShoppingBag } from 'lucide-react';
import { ExtensionSlot, useAssignedExtensions } from '@egen-civitas/esm-framework';
import { WaterGlassModal } from '../ui/WaterGlassModal';
import { OPTION_PANEL_CLASS, TopBarOptionButton, type OptionPanelProps } from './TopBarOptionButton';
import styles from './topbar-options.scss';

// Raccourcis — le badge reflète le nombre RÉEL d'éléments du slot
// "quick-access-slot" ; le bouton disparaît tant que rien n'y est injecté.

const QuickAccessOption: React.FC<OptionPanelProps> = ({ open, onToggle, className = '' }) => {
  const { t } = useTranslation();
  const items = useAssignedExtensions('quick-access-slot');

  if (items.length === 0) return null;

  return (
    <div className={`relative overflow-visible items-center ${className || 'flex'}`}>
      <TopBarOptionButton
        label={t('quickAccess', 'Raccourcis')}
        active={open}
        badge={items.length > 9 ? '9+' : items.length}
        onClick={onToggle}
        icon={<ShoppingBag className="w-4.5 h-4.5 sm:w-5 sm:h-5" />}
      />
      {open && (
        <WaterGlassModal
          align="none"
          className={`${OPTION_PANEL_CLASS} w-[calc(100vw-16px)] sm:w-72`}
          contentClassName="p-2.5"
          header={
            <span className="text-[10px] font-bold text-teal-300 uppercase tracking-wider">
              {t('quickAccess', 'Raccourcis')}
            </span>
          }
        >
          <div className={styles.list} role="menu" aria-label={t('quickAccess', 'Raccourcis')}>
            <ExtensionSlot name="quick-access-slot" />
          </div>
        </WaterGlassModal>
      )}
    </div>
  );
};

export default QuickAccessOption;
