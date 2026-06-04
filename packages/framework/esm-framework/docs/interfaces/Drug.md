[O3 Framework](../API.md) / Drug

# Interface: Drug

Defined in: [packages/framework/esm-emr-api/src/types/drug-resource.ts:3](https://github.com/egen/egen-esm-core/blob/main/packages/framework/esm-emr-api/src/types/drug-resource.ts#L3)

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

### concept

> **concept**: [`Concept`](Concept.md)

Defined in: [packages/framework/esm-emr-api/src/types/drug-resource.ts:6](https://github.com/egen/egen-esm-core/blob/main/packages/framework/esm-emr-api/src/types/drug-resource.ts#L6)

***

### display

> **display**: `string`

Defined in: [packages/framework/esm-emr-api/src/types/drug-resource.ts:8](https://github.com/egen/egen-esm-core/blob/main/packages/framework/esm-emr-api/src/types/drug-resource.ts#L8)

#### Overrides

[`EgenResource`](EgenResource.md).[`display`](EgenResource.md#display)

***

### dosageForm

> **dosageForm**: [`EgenResource`](EgenResource.md)

Defined in: [packages/framework/esm-emr-api/src/types/drug-resource.ts:7](https://github.com/egen/egen-esm-core/blob/main/packages/framework/esm-emr-api/src/types/drug-resource.ts#L7)

***

### links?

> `optional` **links**: [`Link`](Link.md)[]

Defined in: [packages/framework/esm-api/src/types/egen-resource.ts:15](https://github.com/egen/egen-esm-core/blob/main/packages/framework/esm-api/src/types/egen-resource.ts#L15)

#### Inherited from

[`EgenResource`](EgenResource.md).[`links`](EgenResource.md#links)

***

### resourceVersion?

> `optional` **resourceVersion**: `string`

Defined in: [packages/framework/esm-api/src/types/egen-resource.ts:17](https://github.com/egen/egen-esm-core/blob/main/packages/framework/esm-api/src/types/egen-resource.ts#L17)

#### Inherited from

[`EgenResource`](EgenResource.md).[`resourceVersion`](EgenResource.md#resourceversion)

***

### strength

> **strength**: `string`

Defined in: [packages/framework/esm-emr-api/src/types/drug-resource.ts:5](https://github.com/egen/egen-esm-core/blob/main/packages/framework/esm-emr-api/src/types/drug-resource.ts#L5)

***

### uuid

> **uuid**: `string`

Defined in: [packages/framework/esm-emr-api/src/types/drug-resource.ts:4](https://github.com/egen/egen-esm-core/blob/main/packages/framework/esm-emr-api/src/types/drug-resource.ts#L4)

#### Overrides

[`EgenResource`](EgenResource.md).[`uuid`](EgenResource.md#uuid)
