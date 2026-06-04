[O3 Framework](../API.md) / egenObservableFetch

# Function: egenObservableFetch()

> **egenObservableFetch**\<`T`\>(`url`, `fetchInit`): `Observable`\<[`FetchResponse`](../interfaces/FetchResponse.md)\<`T`\>\>

Defined in: [packages/framework/esm-api/src/egen-fetch.ts:279](https://github.com/egen/egen-esm-core/blob/main/packages/framework/esm-api/src/egen-fetch.ts#L279)

The egenObservableFetch function is a wrapper around egenFetch
that returns an [Observable](https://rxjs-dev.firebaseapp.com/guide/observable)
instead of a promise. It exists in case using an Observable is
preferred or more convenient than a promise.

## Type Parameters

### T

`T`

## Parameters

### url

`string`

See [[egenFetch]]

### fetchInit

[`FetchConfig`](../interfaces/FetchConfig.md) = `{}`

See [[egenFetch]]

## Returns

`Observable`\<[`FetchResponse`](../interfaces/FetchResponse.md)\<`T`\>\>

An Observable that produces exactly one Response object.
The response object is exactly the same as for [[egenFetch]].

## Example

```js
import { egenObservableFetch } from '@egen/esm-api'
const subscription = egenObservableFetch(`${restBaseUrl}/session').subscribe(
  response => console.log(response.data),
  err => {throw err},
  () => console.log('finished')
)
subscription.unsubscribe()
```

#### Cancellation

To cancel the network request, simply call `subscription.unsubscribe();`
