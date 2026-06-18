import {
  fetchCurrentEntity,
  makeUrl,
  messageEgenServiceWorker,
  setupDynamicOfflineDataHandler,
} from '@egen/esm-framework';
import { cacheForOfflineHeaders } from './constants';

export function setupOffline() {
  setupDynamicOfflineDataHandler({
    id: 'esm-offline-tools-app:entity',
    displayName: 'Offline tools',
    type: 'entity',
    async isSynced(identifier) {
      const expectedUrls = [`/ws/fhir2/R4/Entity/${identifier}`];
      const absoluteExpectedUrls = expectedUrls.map((url) => window.origin + makeUrl(url));
      const cache = await caches.open('egen-spa-cache-v1');
      const keys = (await cache.keys()).map((key) => key.url);
      return absoluteExpectedUrls.every((url) => keys.includes(url));
    },
    async sync(identifier) {
      await messageEgenServiceWorker({
        type: 'registerDynamicRoute',
        pattern: `/ws/fhir2/R4/Entity/${identifier}`,
      });

      await fetchCurrentEntity(identifier, {
        headers: cacheForOfflineHeaders,
      });
    },
  });
}
