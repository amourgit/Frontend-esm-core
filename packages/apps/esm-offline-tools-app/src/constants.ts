import type { EgenOfflineHttpHeaders } from '@egen/esm-framework';
import { egenOfflineCachingStrategyHttpHeaderName } from '@egen/esm-framework';

export const routes = {
  home: `home`,
  offlineTools: `offline-tools`,
  offlineToolsEntities: `offline-tools/entities`,
  offlineToolsEntityOfflineData: `offline-tools/entities/:entityUuid/offline-data`,
  offlineToolsActions: `offline-tools/actions`,
};

export const cacheForOfflineHeaders: EgenOfflineHttpHeaders = {
  [egenOfflineCachingStrategyHttpHeaderName]: 'network-first',
};
