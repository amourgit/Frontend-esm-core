[O3 Framework](../API.md) / UseServerPaginationOptions

# Interface: UseServerPaginationOptions\<R\>

Defined in: [packages/framework/esm-react-utils/src/useEgenPagination.ts:13](https://github.com/egen/egen-esm-core/blob/main/packages/framework/esm-react-utils/src/useEgenPagination.ts#L13)

## Type Parameters

### R

`R`

## Properties

### fetcher()?

> `optional` **fetcher**: (`key`) => `Promise`\<[`FetchResponse`](FetchResponse.md)\<`R`\>\>

Defined in: [packages/framework/esm-react-utils/src/useEgenPagination.ts:22](https://github.com/egen/egen-esm-core/blob/main/packages/framework/esm-react-utils/src/useEgenPagination.ts#L22)

The fetcher to use. Defaults to egenFetch

#### Parameters

##### key

`string`

#### Returns

`Promise`\<[`FetchResponse`](FetchResponse.md)\<`R`\>\>

***

### immutable?

> `optional` **immutable**: `boolean`

Defined in: [packages/framework/esm-react-utils/src/useEgenPagination.ts:17](https://github.com/egen/egen-esm-core/blob/main/packages/framework/esm-react-utils/src/useEgenPagination.ts#L17)

Whether to use useSWR or useSWRInfinite to fetch data

***

### swrConfig?

> `optional` **swrConfig**: `SWRConfiguration`

Defined in: [packages/framework/esm-react-utils/src/useEgenPagination.ts:27](https://github.com/egen/egen-esm-core/blob/main/packages/framework/esm-react-utils/src/useEgenPagination.ts#L27)

The configuration object for useSWR or useSWRInfinite
