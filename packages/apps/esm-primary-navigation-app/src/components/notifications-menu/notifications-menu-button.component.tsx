import React from 'react';
import { useTranslation } from 'react-i18next';
import { TopBarIconButton, useAssignedExtensions, useOnClickOutside } from '@egen-civitas/esm-framework';
import NotificationsMenuPanel from './notifications-menu-panel.component';
import { type MenuButtonProps } from '../topbar/types';
import styles from './notifications-menu.scss';

const BellIcon: React.FC = () => (
  <svg width="18" height="18" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path
      d="M8 2a4 4 0 00-4 4v2.2c0 .4-.15.78-.42 1.06L2.5 10.4a1 1 0 00.7 1.7h9.6a1 1 0 00.7-1.7l-1.08-1.14A1.5 1.5 0 0112 8.2V6a4 4 0 00-4-4z"
      stroke="currentColor"
      strokeWidth="1.25"
      strokeLinejoin="round"
    />
    <path d="M6.3 13.2a1.8 1.8 0 003.4 0" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
  </svg>
);

const NotificationsMenuButton: React.FC<MenuButtonProps> = ({ isActivePanel, togglePanel, hidePanel }) => {
  const { t } = useTranslation();
  const notificationItems = useAssignedExtensions('notifications-nav-menu-slot');
  const isOpen = isActivePanel('notificationsMenu');
  const wrapperRef = useOnClickOutside<HTMLDivElement>(hidePanel('notificationsMenu'), isOpen);

  return (
    <div ref={wrapperRef} className={styles.panelWrapper}>
      <TopBarIconButton
        label={t('notifications', 'Notifications')}
        active={isOpen}
        badge={notificationItems.length > 9 ? '9+' : notificationItems.length}
        onClick={() => togglePanel('notificationsMenu')}
        icon={<BellIcon />}
      />
      <NotificationsMenuPanel expanded={isOpen} />
    </div>
  );
};

export default NotificationsMenuButton;
