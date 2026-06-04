[O3 Framework](../API.md) / Encounter

# Interface: Encounter

Defined in: [packages/framework/esm-emr-api/src/types/encounter-resource.ts:9](https://github.com/egen/egen-esm-core/blob/main/packages/framework/esm-emr-api/src/types/encounter-resource.ts#L9)

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

### diagnoses?

> `optional` **diagnoses**: [`Diagnosis`](Diagnosis.md)[]

Defined in: [packages/framework/esm-emr-api/src/types/encounter-resource.ts:17](https://github.com/egen/egen-esm-core/blob/main/packages/framework/esm-emr-api/src/types/encounter-resource.ts#L17)

***

### display?

> `optional` **display**: `string`

Defined in: [packages/framework/esm-api/src/types/egen-resource.ts:14](https://github.com/egen/egen-esm-core/blob/main/packages/framework/esm-api/src/types/egen-resource.ts#L14)

#### Inherited from

[`EgenResource`](EgenResource.md).[`display`](EgenResource.md#display)

***

### encounterDatetime?

> `optional` **encounterDatetime**: `string`

Defined in: [packages/framework/esm-emr-api/src/types/encounter-resource.ts:10](https://github.com/egen/egen-esm-core/blob/main/packages/framework/esm-emr-api/src/types/encounter-resource.ts#L10)

***

### encounterProviders?

> `optional` **encounterProviders**: [`EncounterProvider`](EncounterProvider.md)[]

Defined in: [packages/framework/esm-emr-api/src/types/encounter-resource.ts:16](https://github.com/egen/egen-esm-core/blob/main/packages/framework/esm-emr-api/src/types/encounter-resource.ts#L16)

***

### encounterType?

> `optional` **encounterType**: [`EncounterType`](EncounterType.md)

Defined in: [packages/framework/esm-emr-api/src/types/encounter-resource.ts:13](https://github.com/egen/egen-esm-core/blob/main/packages/framework/esm-emr-api/src/types/encounter-resource.ts#L13)

***

### form?

> `optional` **form**: [`EgenResource`](EgenResource.md)

Defined in: [packages/framework/esm-emr-api/src/types/encounter-resource.ts:18](https://github.com/egen/egen-esm-core/blob/main/packages/framework/esm-emr-api/src/types/encounter-resource.ts#L18)

***

### links?

> `optional` **links**: [`Link`](Link.md)[]

Defined in: [packages/framework/esm-api/src/types/egen-resource.ts:15](https://github.com/egen/egen-esm-core/blob/main/packages/framework/esm-api/src/types/egen-resource.ts#L15)

#### Inherited from

[`EgenResource`](EgenResource.md).[`links`](EgenResource.md#links)

***

### location?

> `optional` **location**: [`Location`](Location.md)

Defined in: [packages/framework/esm-emr-api/src/types/encounter-resource.ts:12](https://github.com/egen/egen-esm-core/blob/main/packages/framework/esm-emr-api/src/types/encounter-resource.ts#L12)

***

### obs?

> `optional` **obs**: [`Obs`](Obs.md)[]

Defined in: [packages/framework/esm-emr-api/src/types/encounter-resource.ts:14](https://github.com/egen/egen-esm-core/blob/main/packages/framework/esm-emr-api/src/types/encounter-resource.ts#L14)

***

### patient?

> `optional` **patient**: [`Patient`](Patient.md)

Defined in: [packages/framework/esm-emr-api/src/types/encounter-resource.ts:11](https://github.com/egen/egen-esm-core/blob/main/packages/framework/esm-emr-api/src/types/encounter-resource.ts#L11)

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

***

### visit?

> `optional` **visit**: [`Visit`](Visit.md)

Defined in: [packages/framework/esm-emr-api/src/types/encounter-resource.ts:15](https://github.com/egen/egen-esm-core/blob/main/packages/framework/esm-emr-api/src/types/encounter-resource.ts#L15)
