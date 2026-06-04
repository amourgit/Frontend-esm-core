import type { EgenOfflineHttpHeaders } from '@egen/esm-framework';
import { egenOfflineCachingStrategyHttpHeaderName } from '@egen/esm-framework';

export const routes = {
  home: `home`,
  offlineTools: `offline-tools`,
  offlineToolsPatients: `offline-tools/patients`,
  offlineToolsPatientOfflineData: `offline-tools/patients/:patientUuid/offline-data`,
  offlineToolsActions: `offline-tools/actions`,
};

export const cacheForOfflineHeaders: EgenOfflineHttpHeaders = {
  [egenOfflineCachingStrategyHttpHeaderName]: 'network-first',
};
