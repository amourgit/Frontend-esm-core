[O3 Framework](../API.md) / interpolateUrl

# Function: interpolateUrl()

> **interpolateUrl**(`template`, `additionalParams?`): `string`

Defined in: [packages/framework/esm-navigation/src/navigation/interpolate-string.ts:37](https://github.com/egen/egen-esm-core/blob/main/packages/framework/esm-navigation/src/navigation/interpolate-string.ts#L37)

Interpolates a string with egenBase and egenSpaBase.

Useful for accepting `${egenBase}` or `${egenSpaBase}`plus additional template
parameters in configurable URLs.

Example usage:
```js
interpolateUrl("test ${egenBase} ${egenSpaBase} ok");
   // will return "test /egen /egen/spa ok"

interpolateUrl("${egenSpaBase}/patient/${patientUuid}", {
   patientUuid: "4fcb7185-c6c9-450f-8828-ccae9436bd82",
}); // will return "/egen/spa/patient/4fcb7185-c6c9-450f-8828-ccae9436bd82"
```

This can be used in conjunction with the `navigate` function like so
```js
navigate({
 to: interpolateUrl(
   "${egenSpaBase}/patient/${patientUuid}",
   { patientUuid: patient.uuid }
 )
}); // will navigate to "/egen/spa/patient/4fcb7185-c6c9-450f-8828-ccae9436bd82"
```

## Parameters

### template

`string`

A string to interpolate

### additionalParams?

Additional values to interpolate into the string template

## Returns

`string`

The interpolated string with all template parameters replaced.
