import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ExtensionSlot, useAssignedExtensions } from '@egen/esm-framework';
import styles from './notifications-menu.scss';

interface NotificationsMenuPanelProps {
  expanded: boolean;
}

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

  // Ne jamais rendre le panneau tant qu'il n'est pas ouvert : le collapse
  // Carbon par défaut ne suffit pas face à nos overrides glass (largeur/fond
  // fixes), le panneau resterait visible au premier chargement.
  if (!expanded) return null;

  return (
    <div className={styles.dropdown} role="menu" aria-label={t('notifications', 'Notifications')}>
      <div className={styles.dropdownHeader}>
        <span>{t('notifications', 'Notifications')}</span>
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
    </div>
  );
};

export default NotificationsMenuPanel;
