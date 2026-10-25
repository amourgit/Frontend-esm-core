import React from 'react';
import { useTranslation } from 'react-i18next';
import { Check } from 'lucide-react';
import { ExtensionSlot, useAssignedExtensions } from '@egen-civitas/esm-framework';
import { NOTIFICATIONS_SLOT } from '../constants';
import styles from './notifications-panel.scss';

// Contenu de la zone droite « Notifications » : les entrées sont injectées par les apps dans
// `notifications-nav-menu-slot` (contrat inchangé : état `{ expanded }` transmis aux extensions).
const slotState = { expanded: true };

const NotificationsPanel: React.FC = () => {
  const { t } = useTranslation();
  const entries = useAssignedExtensions(NOTIFICATIONS_SLOT);

  return (
    <div className={styles.panel} role="menu" aria-label={t('notifications', 'Notifications')}>
      <ExtensionSlot name={NOTIFICATIONS_SLOT} state={slotState} />
      {entries.length === 0 && (
        <div className={styles.emptyState}>
          <Check size={20} aria-hidden="true" />
          <p>{t('noNewNotifications', 'Aucune nouvelle notification')}</p>
        </div>
      )}
    </div>
  );
};

export default NotificationsPanel;
