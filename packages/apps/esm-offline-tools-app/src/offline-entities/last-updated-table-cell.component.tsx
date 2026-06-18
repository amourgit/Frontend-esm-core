import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from '@carbon/react';
import { PendingFilled, WarningAltFilled, CheckmarkOutline } from '@carbon/react/icons';
import type { DynamicOfflineDataSyncState } from '@egen/esm-framework';
import { getDynamicOfflineDataHandlers, navigate } from '@egen/esm-framework';
import styles from './last-updated-table-cell.scss';

export interface LastUpdatedTableCellProps {
  entityUuid: string;
  isSyncing: boolean;
  lastSyncState?: DynamicOfflineDataSyncState;
}

const LastUpdatedTableCell: React.FC<LastUpdatedTableCellProps> = ({ entityUuid, isSyncing, lastSyncState }) => {
  const { t } = useTranslation();

  const InnerContent = () => {
    if (isSyncing) {
      return (
        <>
          <PendingFilled className={styles.pendingIcon} />
          {t('offlineEntitiesTableLastUpdatedDownloading', 'Downloading...')}
        </>
      );
    }

    if (!lastSyncState) {
      return (
        <>
          <WarningAltFilled className={styles.errorIcon} />
          {t('offlineEntitiesTableLastUpdatedNotYetSynchronized', 'Not synchronized')}
        </>
      );
    }

    if (hasNewUnknownHandlers(lastSyncState)) {
      return (
        <>
          <WarningAltFilled className={styles.errorIcon} />
          {t('offlineEntitiesTableLastUpdatedOutdatedData', 'Outdated data')}
        </>
      );
    }

    if (lastSyncState.erroredHandlers.length > 0) {
      return (
        <>
          <WarningAltFilled className={styles.errorIcon} />
          <Link
            onClick={() =>
              navigate({
                to: `${window.getEgenSpaBase()}offline-tools/entities/${entityUuid}/offline-data`,
              })
            }
          >
            {lastSyncState.erroredHandlers.length}{' '}
            {lastSyncState.erroredHandlers.length === 1
              ? t('offlineEntitiesTableLastUpdatedError', 'error')
              : t('offlineEntitiesTableLastUpdatedErrors', 'errors')}
          </Link>
        </>
      );
    }

    return (
      <>
        <CheckmarkOutline />
        {lastSyncState.syncedOn.toLocaleDateString()}
      </>
    );
  };

  return (
    <div className={styles.cellContainer}>
      <InnerContent />
    </div>
  );
};

function hasNewUnknownHandlers(lastSyncState: DynamicOfflineDataSyncState) {
  const currentHandlers = getDynamicOfflineDataHandlers()
    .filter((handler) => handler.type === 'entity')
    .map((handler) => handler.id);
  const lastSyncHandlers = [...lastSyncState.succeededHandlers, ...lastSyncState.erroredHandlers];

  return currentHandlers.some((id) => !lastSyncHandlers.includes(id));
}

export default LastUpdatedTableCell;
