import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { RefreshCwIcon } from 'lucide-react';
import {
  Button,
  Checkbox,
  Layer,
  SearchInput,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  deleteSynchronizationItem,
  getDynamicOfflineDataEntries,
  getFullSynchronizationItems,
  isDesktop,
  removeDynamicOfflineData,
  showModal,
  syncDynamicOfflineData,
  useLayoutType,
  type DynamicOfflineDataSyncState,
} from '@egen-civitas/esm-framework';
import { useOfflineEntitiesWithEntries, useOfflineRegisteredEntities } from '../hooks/offline-entity-data-hooks';
import EmptyState from './empty-state.component';
import LastUpdatedTableCell from './last-updated-table-cell.component';
import EntityNameTableCell from './entity-name-table-cell.component';
import styles from './offline-entity-table.module.css';
import type { OfflineEntity } from '../types';

export interface OfflineEntityTableProps {
  isInteractive: boolean;
  showHeader: boolean;
}

const OfflineEntityTable: React.FC<OfflineEntityTableProps> = ({ isInteractive, showHeader }) => {
  const { t } = useTranslation();
  const layout = useLayoutType();
  const offlineEntitiesSwr = useOfflineEntitiesWithEntries();
  const offlineRegisteredEntitiesSwr = useOfflineRegisteredEntities();
  const toolbarItemSize = isDesktop(layout) ? 'sm' : undefined;
  const [syncingEntityUuids, setSyncingEntityUuids] = useState<Array<string>>([]);
  const headers = useOfflineEntityTableHeaders();
  const rows = useOfflineEntityTableRows(syncingEntityUuids);
  const [searchValue, setSearchValue] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const visibleRows = useMemo(() => filterTableRows(rows, headers, searchValue), [rows, headers, searchValue]);
  const selectedRows = useMemo(() => rows.filter((row) => selectedIds.has(row.id)), [rows, selectedIds]);
  const visibleSelectedCount = visibleRows.filter((row) => selectedIds.has(row.id)).length;
  const toggleRow = (id: string, checked: boolean) =>
    setSelectedIds((current) => {
      const next = new Set(current);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  const toggleAllVisible = (checked: boolean) =>
    setSelectedIds((current) => {
      const next = new Set(current);
      visibleRows.forEach((row) => (checked ? next.add(row.id) : next.delete(row.id)));
      return next;
    });

  const handleUpdateSelectedEntitiesClick = async (selectedRows) => {
    const selectedEntityUuids = selectedRows.map((row) => row.id);
    setSyncingEntityUuids(selectedEntityUuids);
    await syncSelectedOfflineEntities(selectedEntityUuids).finally(() => setSyncingEntityUuids([]));

    offlineEntitiesSwr.mutate();
    offlineRegisteredEntitiesSwr.mutate();
  };

  const handleRemoveEntitiesFromOfflineListClick = async (selectedRows) => {
    const closeModal = showModal('offline-tools-confirmation-modal', {
      title: t('offlineEntitiesTableDeleteConfirmationModalTitle', 'Remove offline entities'),
      children: t(
        'offlineEntitiesTableDeleteConfirmationModalContent',
        'Are you sure that you want to remove all selected entities from the offline list? They will no longer be available in offline mode and any newly registered entity will be permanently deleted.',
      ),
      confirmText: t('offlineEntitiesTableDeleteConfirmationModalConfirm', 'Remove entities'),
      cancelText: t('offlineEntitiesTableDeleteConfirmationModalCancel', 'Cancel'),
      closeModal: () => closeModal(),
      onConfirm: async () => {
        await removeSelectedOfflineEntities(selectedRows.map((row) => row.id));
        offlineEntitiesSwr.mutate();
        offlineRegisteredEntitiesSwr.mutate();
      },
    });
  };

  if (offlineEntitiesSwr.isValidating || offlineRegisteredEntitiesSwr.isValidating) {
    return <TableSkeleton showHeader={showHeader} />;
  }

  if (offlineEntitiesSwr?.data?.length === 0 && offlineRegisteredEntitiesSwr?.data?.length === 0) {
    return (
      <EmptyState
        displayText={t('offlineEntities_lower', 'offline entities')}
        headerTitle={t('offlineEntities', 'Offline entities')}
      />
    );
  }

  return (
    <div className={styles.tableContainer}>
      <div className={styles.tableHeaderContainer}>
        {showHeader && <h4 className={styles.tableHeader}>{t('offlineEntitiesTableTitle', 'Offline entities')}</h4>}
        {selectedRows.length === 0 && (
          <Layer className="bg-transparent">
            <SearchInput
              containerClassName={styles.tableSearch}
              label={t('offlineEntitiesTableSearchLabel', 'Search this list')}
              placeholder={t('offlineEntitiesTableSearchPlaceholder', 'Search this list')}
              value={searchValue}
              onValueChange={setSearchValue}
            />
          </Layer>
        )}
        {selectedRows.length > 0 && (
          <>
            <Button
              className={styles.tableSecondaryAction}
              variant="ghost"
              size={toolbarItemSize}
              onClick={() => handleUpdateSelectedEntitiesClick(selectedRows)}
            >
              <RefreshCwIcon size={16} />
              {selectedRows.length === 1
                ? t('offlineEntitiesTableUpdateEntity', 'Update entity')
                : t('offlineEntitiesTableUpdateEntities', 'Update entities')}
            </Button>
            <Button
              className={styles.tablePrimaryAction}
              variant="destructive"
              size={toolbarItemSize}
              onClick={() => handleRemoveEntitiesFromOfflineListClick(selectedRows)}
            >
              {t('offlineEntitiesTableRemoveFromOfflineList', 'Remove from list')}
            </Button>
          </>
        )}
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            {isInteractive && (
              <TableHead className="w-10">
                <Checkbox
                  aria-label={t('selectAll', 'Select all')}
                  checked={
                    visibleRows.length > 0 && visibleSelectedCount === visibleRows.length
                      ? true
                      : visibleSelectedCount > 0
                        ? 'indeterminate'
                        : false
                  }
                  onCheckedChange={(checked) => toggleAllVisible(checked === true)}
                />
              </TableHead>
            )}
            {headers.map((header) => (
              <TableHead key={header.key}>{header.header}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {visibleRows.map((row) => (
            <TableRow key={row.id} data-state={selectedIds.has(row.id) ? 'selected' : undefined}>
              {isInteractive && (
                <TableCell className="w-10">
                  <Checkbox
                    aria-label={t('selectRow', 'Select row')}
                    checked={selectedIds.has(row.id)}
                    onCheckedChange={(checked) => toggleRow(row.id, checked === true)}
                  />
                </TableCell>
              )}
              {headers.map(({ key }) => (
                <TableCell key={key}>{row[key]?.value ?? row[key]}</TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

const TableSkeleton: React.FC<{ showHeader: boolean }> = ({ showHeader }) => {
  return (
    <div className={styles.tableContainer}>
      <div className={styles.tableHeaderContainer}>
        {showHeader && <Skeleton className={`${styles.tableHeader} h-6 w-1/5`} />}
        <Skeleton className={`${styles.tableSearch} h-9`} />
      </div>
      <div className="flex flex-col gap-2 p-2">
        {Array.from({ length: 5 }, (_, index) => (
          <Skeleton key={index} className="h-8 w-full" />
        ))}
      </div>
    </div>
  );
};

function filterTableRows(rows: Array<any>, headers: Array<{ key: string }>, inputValue: string) {
  const needle = inputValue.replace(/\s/g, '').toLowerCase();
  if (!needle) return rows;
  return rows.filter((row) =>
    headers.some(({ key }) => {
      const value = row[key];
      const filterableValue = value?.filterableValue?.toString() ?? value?.toString() ?? '';
      return filterableValue.replace(/\s/g, '').toLowerCase().includes(needle);
    }),
  );
}

function useOfflineEntityTableHeaders() {
  const { t } = useTranslation();
  return useMemo(
    () => [
      {
        key: 'name',
        header: t('offlineEntitiesTableHeaderName', 'Name'),
      },
      {
        key: 'lastUpdated',
        header: t('offlineEntitiesTableHeaderLastUpdated', 'Last updated'),
      },
    ],
    [t],
  );
}

function useOfflineEntityTableRows(syncingEntityUuids: Array<string>) {
  const offlineEntitiesSwr = useOfflineEntitiesWithEntries();
  const offlineRegisteredEntitiesSwr = useOfflineRegisteredEntities();

  return useMemo(() => {
    const result = [];
    const mapEntityToRow = (
      entity: OfflineEntity,
      isNewlyRegistered: boolean,
      lastSyncState?: DynamicOfflineDataSyncState,
    ) => ({
      id: entity.id,
      name: {
        value: <EntityNameTableCell key={entity.id} entity={entity} isNewlyRegistered={isNewlyRegistered} />,
        filterableValue: entity.name ?? '',
      },
      lastUpdated: isNewlyRegistered ? (
        '--'
      ) : (
        <LastUpdatedTableCell
          key={entity.id}
          entityUuid={entity.id}
          isSyncing={syncingEntityUuids.includes(entity.id)}
          lastSyncState={lastSyncState}
        />
      ),
    });

    for (const entity of offlineRegisteredEntitiesSwr.data ?? []) {
      result.push(mapEntityToRow(entity, true));
    }

    for (const { entity, entry } of offlineEntitiesSwr.data ?? []) {
      result.push(mapEntityToRow(entity, false, entry.syncState));
    }

    return result;
  }, [syncingEntityUuids, offlineEntitiesSwr.data, offlineRegisteredEntitiesSwr.data]);
}

async function syncSelectedOfflineEntities(selectedEntityUuids: Array<string>) {
  const offlineEntityEntries = await getDynamicOfflineDataEntries('entity-registration');
  const syncableEntityUuids = offlineEntityEntries.map((entry) => entry.identifier);
  const offlineEntityUuidsToSync = selectedEntityUuids.filter((id) => syncableEntityUuids.includes(id));

  return await Promise.all(
    offlineEntityUuidsToSync.map((entityUuid) => syncDynamicOfflineData('entity', entityUuid)),
  );
}

async function removeSelectedOfflineEntities(selectedEntityUuids: Array<string>) {
  const offlineEntityEntries = await getDynamicOfflineDataEntries('entity');
  const offlineRegisteredEntities = await getFullSynchronizationItems<{
    entity: OfflineEntity;
  }>('entity-registration');
  const offlineEntityUuidsToBeDeleted = selectedEntityUuids.filter((id) =>
    offlineEntityEntries.some((entry) => entry.identifier === id),
  );
  const offlineRegisteredEntityUuidsToBeDeleted = selectedEntityUuids.filter(
    (id) => !offlineEntityUuidsToBeDeleted.includes(id),
  );

  const promises = [
    ...offlineEntityUuidsToBeDeleted.map((entityUuid) => removeDynamicOfflineData('entity', entityUuid)),
    ...offlineRegisteredEntityUuidsToBeDeleted.map(async (entityUuid) => {
      const offlineRegisteredEntity = offlineRegisteredEntities.find(
        (syncItem) => syncItem.content.entity.id === entityUuid,
      );

      if (offlineRegisteredEntity) {
        await deleteSynchronizationItem(offlineRegisteredEntity.id);
      }
    }),
  ];

  await Promise.all(promises);
}

export default OfflineEntityTable;
