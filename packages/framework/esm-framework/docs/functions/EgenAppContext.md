[O3 Framework](../API.md) / EgenAppContext

# Function: EgenAppContext()

> **EgenAppContext**\<`T`\>(`__namedParameters`): `null`

Defined in: [packages/framework/esm-react-utils/src/EgenContext.ts:24](https://github.com/egen/egen-esm-core/blob/main/packages/framework/esm-react-utils/src/EgenContext.ts#L24)

EgenAppContext is a simple React component meant to function similarly to React's Context,
but built on top of the EgenAppContext.

## Type Parameters

### T

`T` *extends* `object` = `object`

## Parameters

### \_\_namedParameters

[`EgenAppContextProps`](../interfaces/EgenAppContextProps.md)\<`T`\>

## Returns

`null`

## Example

```ts
   <EgenAppContext namespace="something" value={{ key: "1234" }} />
```

**Notes on usage:** Unlike a proper React context where the value is limited to the subtree under the
context component, the `EgenAppContext` is inherently global in scope. That means that _all applications_
will see the values that you set for the namespace if they load the value of the namespace.
