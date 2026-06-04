[O3 Framework](../API.md) / makeUrl

# Function: makeUrl()

> **makeUrl**(`path`): `string`

Defined in: [packages/framework/esm-api/src/egen-fetch.ts:30](https://github.com/egen/egen-esm-core/blob/main/packages/framework/esm-api/src/egen-fetch.ts#L30)

Append `path` to the Egen SPA base.

## Parameters

### path

`string`

The path to append to the Egen base URL.

## Returns

`string`

The full URL with the Egen base prepended. If the path is already
  an absolute URL (starting with 'http'), it is returned unchanged.

## Example

```ts
makeUrl('/foo/bar');
// => '/egen/foo/bar'
```
