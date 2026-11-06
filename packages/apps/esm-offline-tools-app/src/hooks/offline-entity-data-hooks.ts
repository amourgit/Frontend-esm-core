import { useMemo } from 'react';
import useSWR, { type SWRResponse } from 'swr';
import { getSynchronizationItems, getDynamicOfflineDataEntries } from '@egen-civitas/esm-framework';
import { fetchEntity } from '../entity-resource';
import merge from 'lodash-es/merge';
import type { OfflineEntity } from '../types';

function useDynamicOfflineDataEntries(type: string) {
  return useSWR(`dynamicOfflineData/entries/${type}`, () => getDynamicOfflineDataEntries(type));
}

function useSynchronizationItems<T>(type: string) {
  return useSWR(`syncQueue/items/${type}`, () => getSynchronizationItems<T>(type));
}

function useRemoteEntities(ids: Array<string>) {
  const stableIds = useMemo(() => [...ids].sort(), [ids]);
  return useSWR(stableIds.length ? ['remoteEntities', stableIds] : null, () =>
    Promise.all(stableIds.map((entityId) => fetchEntity(entityId))),
  );
}

export function useOfflineRegisteredEntities() {
  const offlineEntitiesSwr = useDynamicOfflineDataEntries('entity');
  const entitySyncItemsSwr = useSynchronizationItems<{ entity?: OfflineEntity }>('entity-registration');

  return useMergedSwr(() => {
    return (entitySyncItemsSwr.data ?? [])
      .filter((registrationItem) => {
        return (
          registrationItem.entity &&
          !(offlineEntitiesSwr.data ?? []).find(
            (offlineEntry) => offlineEntry.identifier === registrationItem.entity.id,
          )
        );
      })
      .map((item) => item.entity);
  }, [offlineEntitiesSwr, entitySyncItemsSwr]);
}

export function useOfflineEntitiesWithEntries() {
  const offlineEntitiesSwr = useDynamicOfflineDataEntries('entity');
  const entitySyncItemsSwr = useSynchronizationItems<{ entity?: OfflineEntity }>('entity-registration');
  const remoteEntitiesSwr = useRemoteEntities(offlineEntitiesSwr.data?.map((entry) => entry.identifier) ?? []);

  return useMergedSwr(() => {
    return (offlineEntitiesSwr.data ?? []).map((offlineEntry) => {
      const matchingRemoteEntity = (remoteEntitiesSwr.data ?? []).find(
        (entity) => entity?.id === offlineEntry.identifier,
      );
      const offlineUpdates = (entitySyncItemsSwr.data ?? [])
        .filter((syncItem) => syncItem.entity?.id === offlineEntry.identifier)
        .map((item) => item.entity);
      const finalEntity = merge({}, matchingRemoteEntity, ...offlineUpdates) as OfflineEntity;

      return { entity: finalEntity, entry: offlineEntry };
    });
  }, [offlineEntitiesSwr, entitySyncItemsSwr, remoteEntitiesSwr]);
}

export function useOfflineEntityStats() {
  const offlineEntitiesSwr = useDynamicOfflineDataEntries('entity');
  const offlineRegisteredEntitiesSwr = useOfflineRegisteredEntities();

  return useMergedSwr(
    () => ({
      downloadedCount: (offlineEntitiesSwr.data ?? []).length,
      registeredCount: (offlineRegisteredEntitiesSwr.data ?? []).length,
    }),
    [offlineEntitiesSwr, offlineRegisteredEntitiesSwr],
  );
}

export function useLastSyncStateOfEntity(entityUuid: string) {
  return useSWR(`offlineTools/offlineEntity/${entityUuid}/lastSyncState`, async () => {
    const offlineEntityEntries = await getDynamicOfflineDataEntries('entity');
    const entityEntry = offlineEntityEntries.find((entry) => entry.identifier === entityUuid);
    return entityEntry?.syncState;
  });
}

function useMergedSwr<T>(computeFn: () => T, swrResponses: Array<SWRResponse>): SWRResponse<T> {
  return useMemo(() => {
    const areAllLoaded = swrResponses.every((res) => !!res.data);
    const data = areAllLoaded ? computeFn() : undefined;
    const error = swrResponses.find((res) => res.error)?.error;
    const mutate: () => Promise<undefined> = async () => {
      await Promise.all(swrResponses.map((res) => res.mutate()));
      return undefined;
    };
    const isValidating = swrResponses.some((res) => res.isValidating);
    const isLoading = swrResponses.some((res) => res.isLoading);

    return { data, error, mutate, isValidating, isLoading };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...swrResponses]);
}
