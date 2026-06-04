[O3 Framework](../API.md) / deleteAttachmentPermanently

# Function: deleteAttachmentPermanently()

> **deleteAttachmentPermanently**(`attachmentUuid`, `abortController`): `Promise`\<[`FetchResponse`](../interfaces/FetchResponse.md)\<`any`\>\>

Defined in: [packages/framework/esm-emr-api/src/attachments.ts:107](https://github.com/egen/egen-esm-core/blob/main/packages/framework/esm-emr-api/src/attachments.ts#L107)

Permanently deletes an attachment from the Egen server. This action cannot
be undone.

## Parameters

### attachmentUuid

`string`

The UUID of the attachment to delete.

### abortController

`AbortController`

An AbortController to allow cancellation of the request.

## Returns

`Promise`\<[`FetchResponse`](../interfaces/FetchResponse.md)\<`any`\>\>

A Promise that resolves with the FetchResponse confirming deletion.

## Example

```ts
import { deleteAttachmentPermanently } from '@egen/esm-framework';
const abortController = new AbortController();
await deleteAttachmentPermanently('attachment-uuid', abortController);
```
