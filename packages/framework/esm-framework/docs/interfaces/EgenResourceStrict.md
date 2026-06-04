[O3 Framework](../API.md) / EgenResourceStrict

# Interface: EgenResourceStrict

Defined in: [packages/framework/esm-api/src/types/egen-resource.ts:12](https://github.com/egen/egen-esm-core/blob/main/packages/framework/esm-api/src/types/egen-resource.ts#L12)

Superclass for all Egen Resources, with strict typings.
If the subclass does not have all attributes (including optional ones)
accounted for, use EgenResource instead.

## Extended by

- [`EgenResource`](EgenResource.md)
- [`PersonAttribute`](PersonAttribute.md)
- [`Person`](Person.md)
- [`PersonName`](PersonName.md)
- [`PersonAddress`](PersonAddress.md)
- [`PatientIdentifierType`](PatientIdentifierType.md)
- [`Patient`](Patient.md)
- [`PatientIdentifier`](PatientIdentifier.md)

## Properties

### auditInfo?

> `optional` **auditInfo**: [`AuditInfo`](AuditInfo.md)

Defined in: [packages/framework/esm-api/src/types/egen-resource.ts:16](https://github.com/egen/egen-esm-core/blob/main/packages/framework/esm-api/src/types/egen-resource.ts#L16)

***

### display?

> `optional` **display**: `string`

Defined in: [packages/framework/esm-api/src/types/egen-resource.ts:14](https://github.com/egen/egen-esm-core/blob/main/packages/framework/esm-api/src/types/egen-resource.ts#L14)

***

### links?

> `optional` **links**: [`Link`](Link.md)[]

Defined in: [packages/framework/esm-api/src/types/egen-resource.ts:15](https://github.com/egen/egen-esm-core/blob/main/packages/framework/esm-api/src/types/egen-resource.ts#L15)

***

### resourceVersion?

> `optional` **resourceVersion**: `string`

Defined in: [packages/framework/esm-api/src/types/egen-resource.ts:17](https://github.com/egen/egen-esm-core/blob/main/packages/framework/esm-api/src/types/egen-resource.ts#L17)

***

### uuid

> **uuid**: `string`

Defined in: [packages/framework/esm-api/src/types/egen-resource.ts:13](https://github.com/egen/egen-esm-core/blob/main/packages/framework/esm-api/src/types/egen-resource.ts#L13)
