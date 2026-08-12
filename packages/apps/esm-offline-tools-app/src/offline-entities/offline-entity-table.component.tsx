import React, { type ChangeEvent, useMemo, useState } from 'react';
import { capitalize } from 'lodash-es';
import { useTranslation } from 'react-i18next';
import {
  Button,
  DataTable,
  DataTableSkeleton,
  Layer,
  Search,
  SearchSkeleton,
  SkeletonText,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableHeader,
  TableRow,
  TableSelectAll,
  TableSelectRow,
} from '@carbon/react';
import { Renew } from '@carbon/react/icons';
import {
  age,
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
import styles from './offline-entity-table.scss';

export interface OfflineEntityTableProps {
  isInteractive: boolean;
  showHeader: boolean;
}

const OfflineEntityTable: React.FC<OfflineEntityTableProps> = ({ isInteractive, showHeader }) => {
  // TODO: Restore @carbon/react type annotations
  const { t } = useTranslation();
  const layout = useLayoutType();
  const offlineEntitiesSwr = useOfflineEntitiesWithEntries();
  const offlineRegisteredEntitiesSwr = useOfflineRegisteredEntities();
  const toolbarItemSize = isDesktop(layout) ? 'sm' : undefined;
  const [syncingEntityUuids, setSyncingEntityUuids] = useState<Array<string>>([]);
  const headers = useOfflineEntityTableHeaders();
  const rows = useOfflineEntityTableRows(syncingEntityUuids);

  const handleUpdateSelectedEntitiesClick = async (selectedRows) => {
    const selectedEntityUuids = selectedRows.map((row) => row.id);
    setSyncingEntityUuids(selectedEntityUuids);
    await syncSelectedOfflineEntities(selectedEntityUuids).finally(() => setSyncingEntityUuids([]));

    offlineEntitiesSwr.mutate();
    offlineRegisteredEntitiesSwr.mutate();
  };

  const handleRemovePatientsFromOfflineListClick = async (selectedRows) => {
    const closeModal = showModal('offline-tools-confirmation-modal', {
      title: t('offlineEntitiesTableDeleteConfirmationModalTitle', 'Remove offline patients'),
      children: t(
        'offlineEntitiesTableDeleteConfirmationModalContent',
        'Are you sure that you want to remove all selected entities from the offline list? They will no longer be available in offline mode and any newly registered entity will be permanently deleted.',
      ),
      confirmText: t('offlineEntitiesTableDeleteConfirmationModalConfirm', 'Remove patients'),
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
    <>
      <DataTable rows={rows} headers={headers} filterRows={filterTableRows}>
        {({
          rows,
          headers,
          getTableProps,
          getHeaderProps,
          getRowProps,
          getTableContainerProps,
          getSelectionProps,
          onInputChange,
          selectedRows,
        }) => (
          <TableContainer className={styles.tableContainer} {...getTableContainerProps()}>
            <div className={styles.tableHeaderContainer}>
              {showHeader && (
                <h4 className={styles.tableHeader}>{t('offlineEntitiesTableTitle', 'Offline entities')}</h4>
              )}
              {selectedRows.length === 0 && (
                <Layer>
                  <Search
                    className={styles.tableSearch}
                    labelText={t('offlineEntitiesTableSearchLabel', 'Search this list')}
                    placeholder={t('offlineEntitiesTableSearchPlaceholder', 'Search this list')}
                    size={toolbarItemSize}
                    onChange={(e) => onInputChange(e as ChangeEvent<HTMLInputElement>)}
                  />
                </Layer>
              )}
              {selectedRows.length > 0 && (
                <>
                  <Button
                    className={styles.tableSecondaryAction}
                    kind="ghost"
                    size={toolbarItemSize}
                    renderIcon={(props) => <Renew size={32} {...props} />}
                    onClick={() => handleUpdateSelectedEntitiesClick(selectedRows)}
                  >
                    {selectedRows.length === 1
                      ? t('offlineEntitiesTableUpdateEntity', 'Update entity')
                      : t('offlineEntitiesTableUpdatePatients', 'Update patients')}
                  </Button>
                  <Button
                    className={styles.tablePrimaryAction}
                    kind="danger"
                    size={toolbarItemSize}
                    onClick={() => handleRemovePatientsFromOfflineListClick(selectedRows)}
                  >
                    {t('offlineEntitiesTableRemoveFromOfflineList', 'Remove from list')}
                  </Button>
                </>
              )}
            </div>
            <Table {...getTableProps()} useZebraStyles>
              <TableHead>
                <TableRow>
                  {isInteractive && <TableSelectAll {...getSelectionProps()} />}
                  {headers.map((header) => (
                    <TableHeader {...getHeaderProps({ header })} isSortable>
                      {header.header}
                    </TableHeader>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((row) => (
                  <TableRow {...getRowProps({ row })}>
                    {isInteractive && <TableSelectRow {...getSelectionProps({ row })} />}
                    {row.cells.map((cell) => (
                      <TableCell key={cell.id}>{cell.value?.value ?? cell.value}</TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </DataTable>
    </>
  );
};

const TableSkeleton: React.FC<{ showHeader: boolean }> = ({ showHeader }) => {
  return (
    <TableContainer className={styles.tableContainer}>
      <div className={styles.tableHeaderContainer}>
        {showHeader && <SkeletonText heading width="20%" className={styles.tableHeader} />}
        <SearchSkeleton className={styles.tableSearch} />
      </div>
      <DataTableSkeleton showToolbar={false} showHeader={false} />
    </TableContainer>
  );
};

function filterTableRows({
  rowIds,
  headers,
  cellsById,
  inputValue,
  // @ts-ignore `getCellId` is not in the types, but present in Carbon.
  getCellId,
}) {
  return rowIds.filter((rowId) =>
    headers.some(({ key }) => {
      const cellId = getCellId(rowId, key);
      const value = cellsById[cellId].value;
      const filterableValue = value?.filterableValue?.toString() ?? value?.toString() ?? '';
      return filterableValue.replace(/\s/g, '').toLowerCase().includes(inputValue.replace(/\s/g, '').toLowerCase());
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
      {
        key: 'gender',
        header: t('offlineEntitiesTableHeaderGender', 'Gender'),
      },
      {
        key: 'age',
        header: t('offlineEntitiesTableHeaderAge', 'Age'),
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
      entity: fhir.Patient,
      isNewlyRegistered: boolean,
      lastSyncState?: DynamicOfflineDataSyncState,
    ) => ({
      id: entity.id,
      name: {
        value: <EntityNameTableCell key={entity.id} entity={entity} isNewlyRegistered={isNewlyRegistered} />,
        filterableValue: JSON.stringify(entity.name),
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
      gender: capitalize(entity.gender),
      age: entity.birthDate ? age(entity.birthDate) : '',
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
  const syncablePatientUuids = offlineEntityEntries.map((entry) => entry.identifier);
  const offlineEntityUuidsToSync = selectedEntityUuids.filter((id) => syncablePatientUuids.includes(id));

  return await Promise.all(
    offlineEntityUuidsToSync.map((entityUuid) => syncDynamicOfflineData('entity', entityUuid)),
  );
}

async function removeSelectedOfflineEntities(selectedEntityUuids: Array<string>) {
  const offlineEntityEntries = await getDynamicOfflineDataEntries('entity');
  const offlineRegisteredPatients = await getFullSynchronizationItems<{
    fhirEntity: fhir.Patient;
  }>('entity-registration');
  const offlineEntityUuidsToBeDeleted = selectedEntityUuids.filter((id) =>
    offlineEntityEntries.some((entry) => entry.identifier === id),
  );
  const offlineRegisteredPatientUuidsToBeDeleted = selectedEntityUuids.filter(
    (id) => !offlineEntityUuidsToBeDeleted.includes(id),
  );

  const promises = [
    ...offlineEntityUuidsToBeDeleted.map((entityUuid) => removeDynamicOfflineData('entity', entityUuid)),
    ...offlineRegisteredPatientUuidsToBeDeleted.map(async (entityUuid) => {
      const offlineRegisteredPatient = offlineRegisteredPatients.find(
        (syncItem) => syncItem.content.fhirEntity.id === entityUuid,
      );

      if (offlineRegisteredPatient) {
        await deleteSynchronizationItem(offlineRegisteredPatient.id);
      }
    }),
  ];

  await Promise.all(promises);
}

export default OfflineEntityTable;
