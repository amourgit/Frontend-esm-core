[O3 Framework](../API.md) / subscribeEgenEvent

# Function: subscribeEgenEvent()

## Call Signature

> **subscribeEgenEvent**(`event`, `handler`): `any`

Defined in: [packages/framework/esm-emr-api/src/events/index.ts:30](https://github.com/egen/egen-esm-core/blob/main/packages/framework/esm-emr-api/src/events/index.ts#L30)

Subscribes to a custom Egen event

### Parameters

#### event

`"started"`

The name of the event to listen to

#### handler

(`payload`) => `void`

The callback to be called when the event fires

### Returns

`any`

## Call Signature

> **subscribeEgenEvent**(`event`, `handler`): `any`

Defined in: [packages/framework/esm-emr-api/src/events/index.ts:31](https://github.com/egen/egen-esm-core/blob/main/packages/framework/esm-emr-api/src/events/index.ts#L31)

Subscribes to a custom Egen event

### Parameters

#### event

`"before-page-changed"`

The name of the event to listen to

#### handler

(`payload`) => `void`

The callback to be called when the event fires

### Returns

`any`
