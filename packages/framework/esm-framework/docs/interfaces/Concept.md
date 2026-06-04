[O3 Framework](../API.md) / Concept

# Interface: Concept

Defined in: [packages/framework/esm-api/src/types/concept-resource.ts:4](https://github.com/egen/egen-esm-core/blob/main/packages/framework/esm-api/src/types/concept-resource.ts#L4)

Superclass for all Egen Resources, with strict typings.
If the subclass does not have all attributes (including optional ones)
accounted for, use EgenResource instead.

## Extends

- [`EgenResource`](EgenResource.md)

## Indexable

\[`anythingElse`: `string`\]: `any`

## Properties

### answers?

> `optional` **answers**: `any`

Defined in: [packages/framework/esm-api/src/types/concept-resource.ts:15](https://github.com/egen/egen-esm-core/blob/main/packages/framework/esm-api/src/types/concept-resource.ts#L15)

***

### attributes?

> `optional` **attributes**: `any`

Defined in: [packages/framework/esm-api/src/types/concept-resource.ts:17](https://github.com/egen/egen-esm-core/blob/main/packages/framework/esm-api/src/types/concept-resource.ts#L17)

***

### auditInfo?

> `optional` **auditInfo**: [`AuditInfo`](AuditInfo.md)

Defined in: [packages/framework/esm-api/src/types/egen-resource.ts:16](https://github.com/egen/egen-esm-core/blob/main/packages/framework/esm-api/src/types/egen-resource.ts#L16)

#### Inherited from

[`EgenResource`](EgenResource.md).[`auditInfo`](EgenResource.md#auditinfo)

***

### conceptClass?

> `optional` **conceptClass**: [`ConceptClass`](ConceptClass.md)

Defined in: [packages/framework/esm-api/src/types/concept-resource.ts:7](https://github.com/egen/egen-esm-core/blob/main/packages/framework/esm-api/src/types/concept-resource.ts#L7)

***

### datatype?

> `optional` **datatype**: [`ConceptDatatype`](ConceptDatatype.md)

Defined in: [packages/framework/esm-api/src/types/concept-resource.ts:6](https://github.com/egen/egen-esm-core/blob/main/packages/framework/esm-api/src/types/concept-resource.ts#L6)

***

### descriptions?

> `optional` **descriptions**: [`EgenResource`](EgenResource.md)[]

Defined in: [packages/framework/esm-api/src/types/concept-resource.ts:12](https://github.com/egen/egen-esm-core/blob/main/packages/framework/esm-api/src/types/concept-resource.ts#L12)

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

### mappings?

> `optional` **mappings**: `any`

Defined in: [packages/framework/esm-api/src/types/concept-resource.ts:14](https://github.com/egen/egen-esm-core/blob/main/packages/framework/esm-api/src/types/concept-resource.ts#L14)

***

### name?

> `optional` **name**: [`ConceptName`](ConceptName.md)

Defined in: [packages/framework/esm-api/src/types/concept-resource.ts:5](https://github.com/egen/egen-esm-core/blob/main/packages/framework/esm-api/src/types/concept-resource.ts#L5)

***

### names?

> `optional` **names**: [`ConceptName`](ConceptName.md)[]

Defined in: [packages/framework/esm-api/src/types/concept-resource.ts:11](https://github.com/egen/egen-esm-core/blob/main/packages/framework/esm-api/src/types/concept-resource.ts#L11)

***

### resourceVersion?

> `optional` **resourceVersion**: `string`

Defined in: [packages/framework/esm-api/src/types/egen-resource.ts:17](https://github.com/egen/egen-esm-core/blob/main/packages/framework/esm-api/src/types/egen-resource.ts#L17)

#### Inherited from

[`EgenResource`](EgenResource.md).[`resourceVersion`](EgenResource.md#resourceversion)

***

### retired?

> `optional` **retired**: `boolean`

Defined in: [packages/framework/esm-api/src/types/concept-resource.ts:10](https://github.com/egen/egen-esm-core/blob/main/packages/framework/esm-api/src/types/concept-resource.ts#L10)

***

### set?

> `optional` **set**: `boolean`

Defined in: [packages/framework/esm-api/src/types/concept-resource.ts:8](https://github.com/egen/egen-esm-core/blob/main/packages/framework/esm-api/src/types/concept-resource.ts#L8)

***

### setMembers?

> `optional` **setMembers**: `any`

Defined in: [packages/framework/esm-api/src/types/concept-resource.ts:16](https://github.com/egen/egen-esm-core/blob/main/packages/framework/esm-api/src/types/concept-resource.ts#L16)

***

### uuid

> **uuid**: `string`

Defined in: [packages/framework/esm-api/src/types/egen-resource.ts:13](https://github.com/egen/egen-esm-core/blob/main/packages/framework/esm-api/src/types/egen-resource.ts#L13)

#### Inherited from

[`EgenResource`](EgenResource.md).[`uuid`](EgenResource.md#uuid)

***

### version?

> `optional` **version**: `string`

Defined in: [packages/framework/esm-api/src/types/concept-resource.ts:9](https://github.com/egen/egen-esm-core/blob/main/packages/framework/esm-api/src/types/concept-resource.ts#L9)
