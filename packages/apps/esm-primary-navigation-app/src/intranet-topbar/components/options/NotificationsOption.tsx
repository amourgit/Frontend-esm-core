import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Bell, Check } from 'lucide-react';
import { ExtensionSlot, useAssignedExtensions } from '@egen-civitas/esm-framework';
import { WaterGlassModal } from '../ui/WaterGlassModal';
import { OPTION_PANEL_CLASS, TopBarOptionButton, type OptionPanelProps } from './TopBarOptionButton';
import styles from './topbar-options.scss';

// Notifications — service réel : slot "notifications-nav-menu-slot"
// (badge = nombre réel d'extensions, état vide explicite).

const NotificationsOption: React.FC<OptionPanelProps> = ({ open, onToggle, className = '' }) => {
  const { t } = useTranslation();
  const items = useAssignedExtensions('notifications-nav-menu-slot');
  const state = useMemo(() => ({ expanded: open }), [open]);

  return (
    <div className={`relative overflow-visible items-center ${className || 'flex'}`}>
      <TopBarOptionButton
        label={t('notifications', 'Notifications')}
        active={open}
        badge={items.length > 9 ? '9+' : items.length}
        onClick={onToggle}
        icon={<Bell className="w-4 h-4 sm:w-4.5 sm:h-4.5" />}
      />
      {open && (
        <WaterGlassModal
          align="none"
          className={`${OPTION_PANEL_CLASS} w-[calc(100vw-16px)] sm:w-80`}
          contentClassName="p-2.5"
          header={
            <span className="text-[10px] font-bold text-teal-300 uppercase tracking-wider">
              {t('notifications', 'Notifications')}
            </span>
          }
        >
          <div className={styles.list} role="menu" aria-label={t('notifications', 'Notifications')}>
            <ExtensionSlot name="notifications-nav-menu-slot" state={state} />
            {items.length === 0 && (
              <div className={styles.emptyState}>
                <Check className="w-5 h-5 mx-auto opacity-60" aria-hidden="true" />
                <p>{t('noNewNotifications', 'Aucune nouvelle notification')}</p>
              </div>
            )}
          </div>
        </WaterGlassModal>
      )}
    </div>
  );
};

export default NotificationsOption;
