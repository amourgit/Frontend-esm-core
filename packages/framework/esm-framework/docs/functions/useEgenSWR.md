[O3 Framework](../API.md) / useEgenSWR

# Function: useEgenSWR()

> **useEgenSWR**\<`DataType`, `ErrorType`\>(`key`, `options`): `SWRResponse`\<[`FetchResponse`](../interfaces/FetchResponse.md)\<`DataType`\>, `ErrorType`, `undefined` \| `SWRConfiguration`\<[`FetchResponse`](../interfaces/FetchResponse.md)\<`DataType`\>, `ErrorType`, `BareFetcher`\<[`FetchResponse`](../interfaces/FetchResponse.md)\<`DataType`\>\>\>\>

Defined in: [packages/framework/esm-react-utils/src/useEgenSWR.ts:70](https://github.com/egen/egen-esm-core/blob/main/packages/framework/esm-react-utils/src/useEgenSWR.ts#L70)

**`Beta`**

This hook is intended to simplify using egenFetch in useSWR, while also ensuring that
all useSWR usages properly use an abort controller, so that fetch requests are cancelled
if the React component unmounts.

## Type Parameters

### DataType

`DataType` = `any`

### ErrorType

`ErrorType` = `any`

## Parameters

### key

[`Key`](../type-aliases/Key.md)

The SWR key to use

### options

[`UseEgenSWROptions`](../type-aliases/UseEgenSWROptions.md) = `{}`

An object of optional parameters to provide, including a [FetchConfig](../interfaces/FetchConfig.md) object
  to pass to [egenFetch](egenFetch.md) or options to pass to SWR

## Returns

`SWRResponse`\<[`FetchResponse`](../interfaces/FetchResponse.md)\<`DataType`\>, `ErrorType`, `undefined` \| `SWRConfiguration`\<[`FetchResponse`](../interfaces/FetchResponse.md)\<`DataType`\>, `ErrorType`, `BareFetcher`\<[`FetchResponse`](../interfaces/FetchResponse.md)\<`DataType`\>\>\>\>

## Examples

```tsx
import { useEgenSWR } from "@egen/esm-framework";

function MyComponent() {
 const { data } = useEgenSWR(key);

 return (
   // render something with data
 );
}
```

Note that if you are using a complex SWR key you must provide a url function to the options parameter,
which translates the key into a URL to be sent to `egenFetch()`

```tsx
import { useEgenSWR } from "@egen/esm-framework";

function MyComponent() {
 const { data } = useEgenSWR(['key', 'url'], { url: (key) => key[1] });

 return (
   // render something with data
 );
}
```
