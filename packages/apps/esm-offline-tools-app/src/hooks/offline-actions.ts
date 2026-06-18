import uniq from 'lodash-es/uniq';
import useSWR from 'swr';
import { fetchCurrentEntity, getFullSynchronizationItems, type SyncItem } from '@egen/esm-framework/src/internal';

export function usePendingSyncItems() {
  return useSWR('offlineActions/pending', () => getFullSynchronizationItems());
}

export function useSyncItemEntities(syncItems?: Array<SyncItem>) {
  const entityUuids = syncItems
    ? uniq(syncItems.map((item) => item?.descriptor?.entityUuid).filter(Boolean))
    : null;

  return useSWR(
    () => (entityUuids ? ['entities', ...entityUuids] : null),
    () => Promise.all(entityUuids.map((id) => fetchCurrentEntity(id))),
  );
}
