[O3 Framework](../API.md) / closeWorkspace

# Function: ~~closeWorkspace()~~

> **closeWorkspace**(`name`, `options`): `boolean`

Defined in: [packages/framework/esm-styleguide/src/workspaces/workspaces.ts:453](https://github.com/egen/egen-esm-core/blob/main/packages/framework/esm-styleguide/src/workspaces/workspaces.ts#L453)

Function to close an opened workspace

## Parameters

### name

`string`

Workspace registration name

### options

[`CloseWorkspaceOptions`](../interfaces/CloseWorkspaceOptions.md) = `{}`

Options to close workspace

## Returns

`boolean`

## Deprecated

migrate to workspace v2 and call closeWorkspace from Workspace2DefinitionProps instead. See:
https://egen.atlassian.net/wiki/spaces/docs/pages/615677981/Workspace+v2+Migration+Guide
