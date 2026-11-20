import React from 'react';
import { Button } from '@egen-civitas/esm-framework';
import {
  getOfflineSynchronizationStore,
  isDesktop,
  runSynchronization,
  useConnectivity,
  useLayoutType,
  useStore,
} from '@egen-civitas/esm-framework/src/internal';
import { RefreshCwIcon as Renew } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { usePendingSyncItems } from '../hooks/offline-actions';
import OfflineActions from './offline-actions.component';
import SharedPageLayout from '../components/shared-page-layout.component';
import styles from './offline-actions-page.styles.module.css';

const OfflineActionsPage: React.FC = () => {
  const { t } = useTranslation();
  const canSynchronizeOfflineActions = useConnectivity();
  const layout = useLayoutType();
  const syncStore = useStore(getOfflineSynchronizationStore());
  const { mutate: mutatePendingSyncItems } = usePendingSyncItems();
  const isSynchronizing = !!syncStore.synchronization;

  const synchronize = () => runSynchronization().finally(() => mutatePendingSyncItems());

  const primaryActions = (
    <Button className={styles.primaryActionButton} size={isDesktop(layout) ? 'sm' : undefined} disabled={isSynchronizing} onClick={synchronize}>
{isDesktop(layout) && <Renew size={16} />}
      {!isDesktop(layout) && <Renew size={16} className={styles.buttonInlineIcon} />}
      {t('offlineActionsUpdateOfflineEntities', 'Update offline entities')}
    </Button>
  );

  return (
    <SharedPageLayout
      header={t('offlineActionsHeader', 'Offline actions')}
      primaryActions={canSynchronizeOfflineActions ? primaryActions : undefined}
    >
      <div className={styles.contentContainer}>
        <OfflineActions />
      </div>
    </SharedPageLayout>
  );
};

export default OfflineActionsPage;
