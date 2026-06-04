[O3 Framework](../API.md) / navigate

# Function: navigate()

> **navigate**(`to`): `void`

Defined in: [packages/framework/esm-navigation/src/navigation/navigate.ts:49](https://github.com/egen/egen-esm-core/blob/main/packages/framework/esm-navigation/src/navigation/navigate.ts#L49)

Calls `location.assign` for non-SPA paths and [navigateToUrl](https://single-spa.js.org/docs/api/#navigatetourl) for SPA paths

#### Example usage:
```js
@example
const config = useConfig();
const submitHandler = () => {
  navigate({ to: config.links.submitSuccess });
};
```

#### Example behavior::
```js
@example
navigate({ to: "/some/path" }); // => window.location.assign("/some/path")
navigate({ to: "https://single-spa.js.org/" }); // => window.location.assign("https://single-spa.js.org/")
navigate({ to: "${egenBase}/some/path" }); // => window.location.assign("/egen/some/path")
navigate({ to: "/egen/spa/foo/page" }); // => navigateToUrl("/egen/spa/foo/page")
navigate({ to: "${egenSpaBase}/bar/page" }); // => navigateToUrl("/egen/spa/bar/page")
navigate({ to: "/${egenSpaBase}/baz/page" }) // => navigateToUrl("/egen/spa/baz/page")
navigate({ to: "https://o3.egen.org/${egenSpaBase}/qux/page" }); // => navigateToUrl("/egen/spa/qux/page")
  if `window.location.origin` == "https://o3.egen.org", else will use window.location.assign
```

## Parameters

### to

[`NavigateOptions`](../interfaces/NavigateOptions.md)

The target path or URL. Supports templating with 'egenBase', 'egenSpaBase',
and any additional template parameters defined in `templateParams`.
For example, `${egenSpaBase}/home` will resolve to `/egen/spa/home`
for implementations using the standard Egen and SPA base paths.
If `templateParams` contains `{ foo: "bar" }`, then the URL `${egenBase}/${foo}`
will become `/egen/bar`.

## Returns

`void`
