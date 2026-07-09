import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { HeaderPanel, type HeaderPanelProps } from '@carbon/react';
import { ExtensionSlot, useAssignedExtensions } from '@egen/esm-framework';
import styles from './notifications-menu-panel.scss';

interface NotificationsMenuPanelProps extends HeaderPanelProps {
  expanded: boolean;
}

const BellIcon: React.FC = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path
      d="M8 2a4 4 0 00-4 4v2.2c0 .4-.15.78-.42 1.06L2.5 10.4a1 1 0 00.7 1.7h9.6a1 1 0 00.7-1.7l-1.08-1.14A1.5 1.5 0 0112 8.2V6a4 4 0 00-4-4z"
      stroke="currentColor"
      strokeWidth="1.25"
      strokeLinejoin="round"
    />
    <path d="M6.3 13.2a1.8 1.8 0 003.4 0" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
  </svg>
);

const CheckIcon: React.FC = () => (
  <svg width="20" height="20" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path d="M2.5 8.5l3.5 3.5L13.5 4" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const NotificationsMenuPanel: React.FC<NotificationsMenuPanelProps> = ({ expanded }) => {
  const { t } = useTranslation();
  const state = useMemo(() => ({ expanded }), [expanded]);
  const notificationItems = useAssignedExtensions('notifications-nav-menu-slot');
  const isEmpty = notificationItems.length === 0;

  return (
    <HeaderPanel className={styles.headerPanel} aria-label="Notifications Panel" expanded={expanded}>
      <div className={styles.heading}>
        <span className={styles.headingLabel}>
          <BellIcon />
          {t('notifications', 'Notifications')}
        </span>
      </div>

      <div className={styles.list}>
        <ExtensionSlot name="notifications-nav-menu-slot" state={state} />

        {isEmpty && (
          <div className={styles.emptyState}>
            <span className={styles.emptyIcon} aria-hidden="true">
              <CheckIcon />
            </span>
            <p>{t('noNewNotifications', 'Aucune nouvelle notification')}</p>
          </div>
        )}
      </div>
    </HeaderPanel>
  );
};

export default NotificationsMenuPanel;
