[O3 Framework](../API.md) / ConceptName

# Interface: ConceptName

Defined in: [packages/framework/esm-api/src/types/concept-resource.ts:27](https://github.com/egen/egen-esm-core/blob/main/packages/framework/esm-api/src/types/concept-resource.ts#L27)

Superclass for all Egen Resources, with strict typings.
If the subclass does not have all attributes (including optional ones)
accounted for, use EgenResource instead.

## Extends

- [`EgenResource`](EgenResource.md)

## Indexable

\[`anythingElse`: `string`\]: `any`

## Properties

### auditInfo?

> `optional` **auditInfo**: [`AuditInfo`](AuditInfo.md)

Defined in: [packages/framework/esm-api/src/types/egen-resource.ts:16](https://github.com/egen/egen-esm-core/blob/main/packages/framework/esm-api/src/types/egen-resource.ts#L16)

#### Inherited from

[`EgenResource`](EgenResource.md).[`auditInfo`](EgenResource.md#auditinfo)

***

### conceptNameType?

> `optional` **conceptNameType**: `"FULLY_SPECIFIED"` \| `"SHORT"` \| `"INDEX_TERM"`

Defined in: [packages/framework/esm-api/src/types/concept-resource.ts:31](https://github.com/egen/egen-esm-core/blob/main/packages/framework/esm-api/src/types/concept-resource.ts#L31)

***

### display?

> `optional` **display**: `string`

Defined in: [packages/framework/esm-api/src/types/egen-resource.ts:14](https://github.com/egen/egen-esm-core/blob/main/packages/framework/esm-api/src/types/egen-resource.ts#L14)

#### Inherited from

[`EgenResource`](EgenResource.md).[`display`](EgenResource.md#display)

***

### links?

> `optional` **links**: [`Link`](Link.md)[]

Defined in: [packages/framework/esm-api/src/types/egen-resource.ts:15](https://github.com/egen/egen-esm-core/blob/main/packages/framework/esm-api/src/types/egen-resource.ts#L15)

#### Inherited from

[`EgenResource`](EgenResource.md).[`links`](EgenResource.md#links)

***

### locale?

> `optional` **locale**: `string`

Defined in: [packages/framework/esm-api/src/types/concept-resource.ts:29](https://github.com/egen/egen-esm-core/blob/main/packages/framework/esm-api/src/types/concept-resource.ts#L29)

***

### localPreferred?

> `optional` **localPreferred**: `boolean`

Defined in: [packages/framework/esm-api/src/types/concept-resource.ts:30](https://github.com/egen/egen-esm-core/blob/main/packages/framework/esm-api/src/types/concept-resource.ts#L30)

***

### name?

> `optional` **name**: `string`

Defined in: [packages/framework/esm-api/src/types/concept-resource.ts:28](https://github.com/egen/egen-esm-core/blob/main/packages/framework/esm-api/src/types/concept-resource.ts#L28)

***

### resourceVersion?

> `optional` **resourceVersion**: `string`

Defined in: [packages/framework/esm-api/src/types/egen-resource.ts:17](https://github.com/egen/egen-esm-core/blob/main/packages/framework/esm-api/src/types/egen-resource.ts#L17)

#### Inherited from

[`EgenResource`](EgenResource.md).[`resourceVersion`](EgenResource.md#resourceversion)

***

### uuid

> **uuid**: `string`

Defined in: [packages/framework/esm-api/src/types/egen-resource.ts:13](https://github.com/egen/egen-esm-core/blob/main/packages/framework/esm-api/src/types/egen-resource.ts#L13)

#### Inherited from

[`EgenResource`](EgenResource.md).[`uuid`](EgenResource.md#uuid)
