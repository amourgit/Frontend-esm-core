import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { beginEditSynchronizationItem, Button, canBeginEditSynchronizationItemsOfType, Checkbox, createErrorHandler, isDesktop, Layer, navigate, Pagination, SearchInput, Skeleton, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TextLink, type SyncItem, useLayoutType, usePagination } from '@egen-civitas/esm-framework';
import styles from './offline-actions-table.styles.module.css';
import type { OfflineEntity } from '../types';

export interface SyncItemWithEntity {
  item: SyncItem;
  entity?: OfflineEntity;
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

  const [searchValue, setSearchValue] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const visibleRows = useMemo(() => filterTableRows(rows, headers, searchValue), [rows, headers, searchValue]);
  const selectedRows = rows.filter((row) => selectedIds.has(row.id));
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

  if (isLoading) {
    return <TableSkeleton />;
  }

  return (
    <div className={styles.tableContainer}>
      <div className={styles.tableHeaderContainer}>
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
          <Button
            className={styles.tablePrimaryAction}
            variant="destructive"
            size={toolbarItemSize}
            disabled={disableEditing || disableDelete}
            onClick={() => onDelete(selectedRows.map((row) => +row.id))}
          >
            {t('offlineActionsTableDeleteActions', 'Delete {{count}} actions', { count: selectedRows.length })}
          </Button>
        )}
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10">
              <Checkbox
                aria-label={t('selectAll', 'Select all')}
                disabled={disableEditing}
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
            {headers.map((header) => (
              <TableHead key={header.key}>{header.header}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {visibleRows.map((row) => (
            <TableRow key={row.id} data-state={selectedIds.has(row.id) ? 'selected' : undefined}>
              <TableCell className="w-10">
                <Checkbox
                  aria-label={t('selectRow', 'Select row')}
                  disabled={disableEditing}
                  checked={selectedIds.has(row.id)}
                  onCheckedChange={(checked) => toggleRow(row.id, checked === true)}
                />
              </TableCell>
              {headers.map(({ key }) => (
                <TableCell key={key}>{row[key]?.value ?? row[key]}</TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <Pagination
        currentItems={results.length}
        totalItems={data.length}
        pageNumber={currentPage}
        pageSize={pageSize}
        onPageNumberChange={({ page, pageSize }) => {
          goTo(page);
          setPageSize(pageSize);
        }}
      />
    </div>
  );
};

const TableSkeleton: React.FC = () => (
  <div className={styles.tableContainer}>
    <div className={styles.tableHeaderContainer}>
      <Skeleton className={`${styles.tableSearch} h-9`} />
    </div>
    <div className="flex flex-col gap-2 p-2">
      {Array.from({ length: 5 }, (_, index) => (
        <Skeleton key={index} className="h-8 w-full" />
      ))}
    </div>
  </div>
);

function getEntityName({ item, entity }: SyncItemWithEntity) {
  if (!item.descriptor?.entityUuid) return undefined;
  return entity?.name || item.descriptor.entityUuid;
}

function ActionNameLink({ syncItem }: { syncItem: SyncItem }) {
  const displayName = syncItem.descriptor.displayName ?? '-';
  if (!canBeginEditSynchronizationItemsOfType(syncItem.type)) return <>{displayName}</>;
  return (
    <TextLink role="button" tabIndex={0} className="cursor-pointer" onClick={() => beginEditSynchronizationItem(syncItem.id).catch((e) => createErrorHandler()(e))}>
      {displayName}
    </TextLink>
  );
}

function EntityLink({ entityUuid, entityName }: { entityUuid?: string; entityName?: string }) {
  return entityUuid ? (
    <TextLink role="link" tabIndex={0} className="cursor-pointer" onClick={() => navigate({ to: `${window.getEgenSpaBase()}entity/${entityUuid}/detail` })}>
      {entityName}
    </TextLink>
  ) : <>-</>;
}

function filterTableRows(rows: Array<any>, headers: Array<{ key: string }>, inputValue: string) {
  const needle = inputValue.toLowerCase();
  if (!needle) return rows;
  return rows.filter((row) =>
    headers.some(({ key }) => {
      const value = row[key];
      const filterableValue = value?.filterableValue?.toString() ?? value?.toString() ?? '';
      return filterableValue.toLowerCase().includes(needle);
    }),
  );
}

export default OfflineActionsTable;
