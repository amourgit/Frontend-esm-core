[O3 Framework](../API.md) / EgenResource

# Interface: EgenResource

Defined in: [packages/framework/esm-api/src/types/egen-resource.ts:3](https://github.com/egen/egen-esm-core/blob/main/packages/framework/esm-api/src/types/egen-resource.ts#L3)

Superclass for all Egen Resources, with strict typings.
If the subclass does not have all attributes (including optional ones)
accounted for, use EgenResource instead.

## Extends

- [`EgenResourceStrict`](EgenResourceStrict.md)

## Extended by

- [`Concept`](Concept.md)
- [`ConceptDatatype`](ConceptDatatype.md)
- [`ConceptName`](ConceptName.md)
- [`ConceptClass`](ConceptClass.md)
- [`User`](User.md)
- [`Diagnosis`](Diagnosis.md)
- [`Drug`](Drug.md)
- [`Encounter`](Encounter.md)
- [`EncounterType`](EncounterType.md)
- [`EncounterProvider`](EncounterProvider.md)
- [`EncounterRole`](EncounterRole.md)
- [`Location`](Location.md)
- [`Obs`](Obs.md)
- [`Order`](Order.md)

## Indexable

\[`anythingElse`: `string`\]: `any`

## Properties

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
