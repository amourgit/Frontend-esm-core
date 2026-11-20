import React from 'react';
import { Layer, Tile } from '@egen-civitas/esm-framework';
import { useTranslation } from 'react-i18next';
import successNotification from '../assets/success-notification.svg';
import styles from './no-actions-empty-state.styles.module.css';

const NoActionsEmptyState: React.FC = () => {
  const { t } = useTranslation();

  return (
    <Layer className={styles.layer}>
      <Tile className={styles.emptyStateContainer}>
        <img
          src={successNotification}
          alt={t('offlineActionsNoActionsEmptyStateImageAlt', 'No Pending Actions Image')}
        />
        <h4 className={styles.productiveHeading01}>
          {t('offlineActionsNoActionsEmptyStateTitle', 'No actions pending upload')}
        </h4>
        <span className={styles.emptyStateDescription}>
          {t(
            'offlineActionsNoActionsEmptyStateContent',
            'All offline actions have been uploaded successfully,\nand merged with the online entity records.',
          )}
        </span>
      </Tile>
    </Layer>
  );
};

export default NoActionsEmptyState;
