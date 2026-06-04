[O3 Framework](../API.md) / RegisterDynamicRouteMessage

# Interface: RegisterDynamicRouteMessage

Defined in: [packages/framework/esm-offline/src/service-worker-messaging.ts:36](https://github.com/egen/egen-esm-core/blob/main/packages/framework/esm-offline/src/service-worker-messaging.ts#L36)

## Extends

- [`EgenServiceWorkerMessage`](EgenServiceWorkerMessage.md)\<`"registerDynamicRoute"`\>

## Properties

### pattern?

> `optional` **pattern**: `string`

Defined in: [packages/framework/esm-offline/src/service-worker-messaging.ts:37](https://github.com/egen/egen-esm-core/blob/main/packages/framework/esm-offline/src/service-worker-messaging.ts#L37)

***

### strategy?

> `optional` **strategy**: [`EgenOfflineCachingStrategy`](../type-aliases/EgenOfflineCachingStrategy.md)

Defined in: [packages/framework/esm-offline/src/service-worker-messaging.ts:39](https://github.com/egen/egen-esm-core/blob/main/packages/framework/esm-offline/src/service-worker-messaging.ts#L39)

***

### type

> **type**: `"registerDynamicRoute"`

Defined in: [packages/framework/esm-offline/src/service-worker-messaging.ts:26](https://github.com/egen/egen-esm-core/blob/main/packages/framework/esm-offline/src/service-worker-messaging.ts#L26)

#### Inherited from

[`EgenServiceWorkerMessage`](EgenServiceWorkerMessage.md).[`type`](EgenServiceWorkerMessage.md#type)

***

### url?

> `optional` **url**: `string`

Defined in: [packages/framework/esm-offline/src/service-worker-messaging.ts:38](https://github.com/egen/egen-esm-core/blob/main/packages/framework/esm-offline/src/service-worker-messaging.ts#L38)
