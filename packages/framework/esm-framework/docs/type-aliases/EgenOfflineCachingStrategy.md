[O3 Framework](../API.md) / EgenOfflineCachingStrategy

# Type Alias: EgenOfflineCachingStrategy

> **EgenOfflineCachingStrategy** = `"network-only-or-cache-only"` \| `"network-first"`

Defined in: [packages/framework/esm-offline/src/service-worker-http-headers.ts:15](https://github.com/egen/egen-esm-core/blob/main/packages/framework/esm-offline/src/service-worker-http-headers.ts#L15)

* `cache-or-network`: The default strategy, equal to the absence of this header.
  The SW attempts to resolve the request via the network, but falls back to the cache if required.
  The service worker decides the strategy to be used.
* `network-first`: See https://developers.google.com/web/tools/workbox/modules/workbox-strategies#network_first_network_falling_back_to_cache.
