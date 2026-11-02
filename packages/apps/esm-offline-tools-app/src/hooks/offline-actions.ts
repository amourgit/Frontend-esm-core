import uniq from 'lodash-es/uniq';
import useSWR from 'swr';
import { getFullSynchronizationItems, type SyncItem } from '@egen-civitas/esm-framework/src/internal';
import { fetchEntity } from '../entity-resource';

export function usePendingSyncItems() {
  return useSWR('offlineActions/pending', () => getFullSynchronizationItems());
}

export function useSyncItemEntities(syncItems?: Array<SyncItem>) {
  const entityUuids = syncItems
    ? uniq(syncItems.map((item) => item?.descriptor?.entityUuid).filter(Boolean))
    : null;

  return useSWR(
    () => (entityUuids ? ['entities', ...entityUuids] : null),
    () => Promise.all(entityUuids.map((id) => fetchEntity(id))),
  );
}
