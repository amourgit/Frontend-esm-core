[O3 Framework](../API.md) / messageEgenServiceWorker

# Function: messageEgenServiceWorker()

> **messageEgenServiceWorker**(`message`): `Promise`\<[`MessageServiceWorkerResult`](../interfaces/MessageServiceWorkerResult.md)\<`any`\>\>

Defined in: [packages/framework/esm-offline/src/service-worker-messaging.ts:11](https://github.com/egen/egen-esm-core/blob/main/packages/framework/esm-offline/src/service-worker-messaging.ts#L11)

Sends the specified message to the application's service worker.

## Parameters

### message

[`KnownEgenServiceWorkerMessages`](../type-aliases/KnownEgenServiceWorkerMessages.md)

The message to be sent.

## Returns

`Promise`\<[`MessageServiceWorkerResult`](../interfaces/MessageServiceWorkerResult.md)\<`any`\>\>

A promise which completes when the message has been successfully processed by the Service Worker.
