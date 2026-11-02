import { makeUrl, messageEgenServiceWorker, setupDynamicOfflineDataHandler } from '@egen-civitas/esm-framework';
import { cacheForOfflineHeaders } from './constants';
import { entityResourcePath, fetchEntity } from './entity-resource';

export function setupOffline() {
  setupDynamicOfflineDataHandler({
    id: 'esm-offline-tools-app:entity',
    displayName: 'Offline tools',
    type: 'entity',
    async isSynced(identifier) {
      const expectedUrls = [`${entityResourcePath}/${identifier}`];
      const absoluteExpectedUrls = expectedUrls.map((url) => window.origin + makeUrl(url));
      const cache = await caches.open('egen-spa-cache-v1');
      const keys = (await cache.keys()).map((key) => key.url);
      return absoluteExpectedUrls.every((url) => keys.includes(url));
    },
    async sync(identifier) {
      await messageEgenServiceWorker({
        type: 'registerDynamicRoute',
        pattern: `${entityResourcePath}/${identifier}`,
      });

      await fetchEntity(identifier, {
        headers: cacheForOfflineHeaders,
      });
    },
  });
}
