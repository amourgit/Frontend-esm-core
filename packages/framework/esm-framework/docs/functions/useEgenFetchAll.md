[O3 Framework](../API.md) / useEgenFetchAll

# Function: useEgenFetchAll()

> **useEgenFetchAll**\<`T`\>(`url`, `options`): `UseServerInfiniteReturnObject`\<`T`, `EgenPaginatedResponse`\<`T`\>\>

Defined in: [packages/framework/esm-react-utils/src/useEgenFetchAll.ts:40](https://github.com/egen/egen-esm-core/blob/main/packages/framework/esm-react-utils/src/useEgenFetchAll.ts#L40)

Most Egen REST endpoints that return a list of objects, such as getAll or search, are server-side paginated.
This hook handles fetching results from *all* pages of a paginated Egen REST endpoint, making multiple requests
as needed.

## Type Parameters

### T

`T`

## Parameters

### url

The URL of the paginated Egen REST endpoint. Note that the `limit` GET param can be set to specify
           the page size; if not set, the page size defaults to the `webservices.rest.maxResultsDefault` value defined
           server-side.
           Similar to useSWRInfinite, this param can be null to disable fetching.

`string` | `URL`

### options

[`UseServerFetchAllOptions`](../interfaces/UseServerFetchAllOptions.md)\<`EgenPaginatedResponse`\<`T`\>\> = `{}`

The options object

## Returns

`UseServerInfiniteReturnObject`\<`T`, `EgenPaginatedResponse`\<`T`\>\>

a UseEgenInfiniteReturnObject object

## See

 - `useEgenPagination`
 - `useEgenInfinite`
 - `useFhirFetchAll`
