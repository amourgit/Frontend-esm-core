[O3 Framework](../API.md) / PersonAttribute

# Interface: PersonAttribute

Defined in: [packages/framework/esm-api/src/types/person-resource.ts:4](https://github.com/egen/egen-esm-core/blob/main/packages/framework/esm-api/src/types/person-resource.ts#L4)

Superclass for all Egen Resources, with strict typings.
If the subclass does not have all attributes (including optional ones)
accounted for, use EgenResource instead.

## Extends

- [`EgenResourceStrict`](EgenResourceStrict.md)

## Properties

### attributeType?

> `optional` **attributeType**: [`EgenResource`](EgenResource.md)

Defined in: [packages/framework/esm-api/src/types/person-resource.ts:5](https://github.com/egen/egen-esm-core/blob/main/packages/framework/esm-api/src/types/person-resource.ts#L5)

***

### auditInfo?

> `optional` **auditInfo**: [`AuditInfo`](AuditInfo.md)

Defined in: [packages/framework/esm-api/src/types/egen-resource.ts:16](https://github.com/egen/egen-esm-core/blob/main/packages/framework/esm-api/src/types/egen-resource.ts#L16)

#### Inherited from

[`EgenResourceStrict`](EgenResourceStrict.md).[`auditInfo`](EgenResourceStrict.md#auditinfo)

***

### display?

> `optional` **display**: `string`

Defined in: [packages/framework/esm-api/src/types/egen-resource.ts:14](https://github.com/egen/egen-esm-core/blob/main/packages/framework/esm-api/src/types/egen-resource.ts#L14)

#### Inherited from

[`EgenResourceStrict`](EgenResourceStrict.md).[`display`](EgenResourceStrict.md#display)

***

### links?

> `optional` **links**: [`Link`](Link.md)[]

Defined in: [packages/framework/esm-api/src/types/egen-resource.ts:15](https://github.com/egen/egen-esm-core/blob/main/packages/framework/esm-api/src/types/egen-resource.ts#L15)

#### Inherited from

[`EgenResourceStrict`](EgenResourceStrict.md).[`links`](EgenResourceStrict.md#links)

***

### resourceVersion?

> `optional` **resourceVersion**: `string`

Defined in: [packages/framework/esm-api/src/types/egen-resource.ts:17](https://github.com/egen/egen-esm-core/blob/main/packages/framework/esm-api/src/types/egen-resource.ts#L17)

#### Inherited from

[`EgenResourceStrict`](EgenResourceStrict.md).[`resourceVersion`](EgenResourceStrict.md#resourceversion)

***

### uuid

> **uuid**: `string`

Defined in: [packages/framework/esm-api/src/types/egen-resource.ts:13](https://github.com/egen/egen-esm-core/blob/main/packages/framework/esm-api/src/types/egen-resource.ts#L13)

#### Inherited from

[`EgenResourceStrict`](EgenResourceStrict.md).[`uuid`](EgenResourceStrict.md#uuid)

***

### value?

> `optional` **value**: `string`

Defined in: [packages/framework/esm-api/src/types/person-resource.ts:6](https://github.com/egen/egen-esm-core/blob/main/packages/framework/esm-api/src/types/person-resource.ts#L6)

***

### voided?

> `optional` **voided**: `boolean`

Defined in: [packages/framework/esm-api/src/types/person-resource.ts:7](https://github.com/egen/egen-esm-core/blob/main/packages/framework/esm-api/src/types/person-resource.ts#L7)
