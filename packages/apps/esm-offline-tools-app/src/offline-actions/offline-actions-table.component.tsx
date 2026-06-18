import React, { type ChangeEvent, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Button,
  DataTable,
  DataTableSkeleton,
  Layer,
  Link,
  Pagination,
  Search,
  SearchSkeleton,
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
import {
  beginEditSynchronizationItem,
  canBeginEditSynchronizationItemsOfType,
  createErrorHandler,
  isDesktop,
  navigate,
  useLayoutType,
  usePagination,
  type SyncItem,
} from '@egen/esm-framework';
import styles from './offline-actions-table.styles.scss';

export interface SyncItemWithEntity {
  item: SyncItem;
  entity?: fhir.Patient;
}

type OfflineActionsTableHeaders = 'createdOn' | 'entity' | 'action' | 'error';

export interface OfflineActionsTableProps {
  data?: Array<SyncItemWithEntity>;
  isLoading: boolean;
  hiddenHeaders?: Array<OfflineActionsTableHeaders>;
  disableEditing: boolean;
  disableDelete: boolean;
  onDelete(syncItemIds: Array<number>): void;
}

const OfflineActionsTable: React.FC<OfflineActionsTableProps> = ({
  isLoading,
  data = [],
  hiddenHeaders,
  disableEditing,
  disableDelete,
  onDelete,
}) => {
  const { t } = useTranslation();
  const [pageSize, setPageSize] = useState(10);
  const { results, currentPage, goTo } = usePagination(data);
  const layout = useLayoutType();
  const toolbarItemSize = isDesktop(layout) ? 'sm' : undefined;

  const defaultHeaders: Array<{ key: OfflineActionsTableHeaders; header: string }> = [
    { key: 'createdOn', header: t('offlineActionsTableCreatedOn', 'Date & Time') },
    { key: 'entity',    header: t('offlineActionsTableEntity', 'Entity') },
    { key: 'action',   header: t('offlineActionsTableAction', 'Action') },
    { key: 'error',    header: t('offlineActionsTableError', 'Error') },
  ];
  const headers = defaultHeaders.filter((header) => !hiddenHeaders?.includes(header.key));

  const rows = results.map((syncItem) => {
    const entityName = getEntityName(syncItem);
    return {
      id: syncItem.item.id.toString(),
      createdOn: syncItem.item.createdOn?.toLocaleDateString(),
      entity: {
        value: <EntityLink entityUuid={syncItem.item.descriptor?.entityUuid} entityName={entityName} />,
        filterableValue: entityName,
      },
      action: {
        value: <ActionNameLink syncItem={syncItem.item} />,
        filterableValue: syncItem.item.descriptor.displayName ?? '-',
      },
      error: syncItem.item.lastError?.message ?? '-',
    };
  });

  if (isLoading) {
    return <TableSkeleton />;
  }

  return (
    <DataTable rows={rows} headers={headers} filterRows={filterTableRows}>
      {({ rows, headers, getTableProps, getHeaderProps, getRowProps, getTableContainerProps, getSelectionProps, onInputChange, selectedRows }) => (
        <TableContainer className={styles.tableContainer} {...getTableContainerProps()}>
          <div className={styles.tableHeaderContainer}>
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
              <Button
                className={styles.tablePrimaryAction}
                kind="danger"
                size={toolbarItemSize}
                disabled={disableEditing || disableDelete}
                onClick={() => onDelete(selectedRows.map((row) => +row.id))}
              >
                {t('offlineActionsTableDeleteActions', 'Delete {{count}} actions', { count: selectedRows.length })}
              </Button>
            )}
          </div>
          <Table {...getTableProps()} isSortable useZebraStyles>
            <TableHead>
              <TableRow>
                <TableSelectAll {...getSelectionProps()} disabled={disableEditing} />
                {headers.map((header) => (
                  <TableHeader {...getHeaderProps({ header })} isSortable key={header.key}>
                    {header.header}
                  </TableHeader>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((row) => (
                <TableRow {...getRowProps({ row })} key={row.id}>
                  <TableSelectRow {...getSelectionProps({ row })} disabled={disableEditing} />
                  {row.cells.map((cell) => (
                    <TableCell key={cell.id}>{cell.value?.value ?? cell.value}</TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Pagination
            pageSizes={[10, 20, 30, 40, 50]}
            page={currentPage}
            pageSize={pageSize}
            totalItems={data.length}
            onChange={({ page, pageSize }) => { goTo(page); setPageSize(pageSize); }}
          />
        </TableContainer>
      )}
    </DataTable>
  );
};

const TableSkeleton: React.FC = () => (
  <TableContainer className={styles.tableContainer}>
    <div className={styles.tableHeaderContainer}>
      <SearchSkeleton className={styles.tableSearch} />
    </div>
    <DataTableSkeleton showToolbar={false} showHeader={false} />
  </TableContainer>
);

function getEntityName({ item, entity }: SyncItemWithEntity) {
  if (!item.descriptor?.entityUuid) return undefined;
  const name = entity?.name?.[0];
  return name ? `${(name.given ?? []).join(' ')} ${name.family}` : item.descriptor.entityUuid;
}

function ActionNameLink({ syncItem }: { syncItem: SyncItem }) {
  const displayName = syncItem.descriptor.displayName ?? '-';
  if (!canBeginEditSynchronizationItemsOfType(syncItem.type)) return <>{displayName}</>;
  return (
    <Link onClick={() => beginEditSynchronizationItem(syncItem.id).catch((e) => createErrorHandler()(e))}>
      {displayName}
    </Link>
  );
}

function EntityLink({ entityUuid, entityName }: { entityUuid?: string; entityName?: string }) {
  return entityUuid ? (
    <Link onClick={() => navigate({ to: `${window.getEgenSpaBase()}entity/${entityUuid}/detail` })}>
      {entityName}
    </Link>
  ) : <>-</>;
}

function filterTableRows({ rowIds, headers, cellsById, inputValue, getCellId }) {
  return rowIds.filter((rowId) =>
    headers.some(({ key }) => {
      const cellId = getCellId(rowId, key);
      const value = cellsById[cellId].value;
      const filterableValue = value?.filterableValue?.toString() ?? value?.toString() ?? '';
      return filterableValue.toLowerCase().includes(inputValue.toLowerCase());
    }),
  );
}

export default OfflineActionsTable;
