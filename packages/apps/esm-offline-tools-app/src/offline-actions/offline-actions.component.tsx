import type { SyncItem } from '@egen/esm-framework/src/internal';
import {
  deleteSynchronizationItem,
  getOfflineSynchronizationStore,
  showModal,
  useStore,
} from '@egen/esm-framework/src/internal';
import React from 'react';
import { useTranslation } from 'react-i18next';
import OfflineActionsTable from './offline-actions-table.component';
import { usePendingSyncItems, useSyncItemEntities } from '../hooks/offline-actions';
import NoActionsEmptyState from './no-actions-empty-state.component';

export interface OfflineActionsProps {
  /**
   * If specified, shows a single entity's offline actions only.
   */
  entityUuid?: string;
  /** @deprecated Use entityUuid */
  entityUuid?: string;
}

const OfflineActions: React.FC<OfflineActionsProps> = ({ entityUuid, entityUuid }) => {
  const resolvedEntityUuid = entityUuid ?? entityUuid;
  const { t } = useTranslation();
  const syncStore = useStore(getOfflineSynchronizationStore());
  const { data: syncItems, mutate } = usePendingSyncItems();
  const { data: syncItemEntities } = useSyncItemEntities(syncItems);
  const syncItemsToRender = resolvedEntityUuid
    ? syncItems?.filter((x) => x.descriptor.entityUuid === resolvedEntityUuid)
    : syncItems;
  const syncItemsTableData = getSyncItemsWithEntity(syncItemsToRender, syncItemEntities);
  const isLoading = !syncItems || !syncItemEntities;
  const isSynchronizing = !!syncStore.synchronization;

  const deleteSynchronizationItems = async (ids: Array<number>) => {
    const closeModal = showModal('offline-tools-confirmation-modal', {
      title: t('offlineActionsDeleteConfirmationModalTitle', 'Delete offline actions'),
      children: t(
        'offlineActionsDeleteConfirmationModalContent',
        'Are you sure that you want to delete all selected offline actions? This cannot be undone!',
      ),
      confirmText: t('offlineActionsDeleteConfirmationModalConfirm', 'Delete forever'),
      cancelText: t('offlineActionsDeleteConfirmationModalCancel', 'Cancel'),
      closeModal: () => closeModal(),
      onConfirm: async () => {
        await Promise.allSettled(ids.map((id) => deleteSynchronizationItem(id)));
        mutate();
      },
    });
  };

  return (
    <>
      {isLoading || syncItems?.length > 0 ? (
        <OfflineActionsTable
          isLoading={isLoading}
          data={syncItemsTableData}
          hiddenHeaders={resolvedEntityUuid ? ['entity'] : []}
          disableEditing={isSynchronizing}
          disableDelete={false}
          onDelete={deleteSynchronizationItems}
        />
      ) : (
        <NoActionsEmptyState />
      )}
    </>
  );
};

function getSyncItemsWithEntity(syncItems: Array<SyncItem> = [], entities: Array<fhir.Patient> = []) {
  return syncItems.map((item) => ({
    item,
    entity: entities.find((entity) => entity.id === item.descriptor?.entityUuid),
  }));
}

export default OfflineActions;
