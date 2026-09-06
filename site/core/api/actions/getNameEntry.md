# getNameEntry

Looks up an AENS name entry.

## Import

```typescript
import { getNameEntry } from '@growae/reactive/actions'
```

## Usage

```typescript
import { getNameEntry } from '@growae/reactive/actions'

const entry = await getNameEntry(config, {
  name: 'myname.chain',
})
```

## Return Type

```typescript
type GetNameEntryReturnType = {
  id: string
  owner: string
  pointers: Array<{ key: string; id: string }>
  ttl: number
}
```

### id

- **Type:** `string`

The name identifier.

### owner

- **Type:** `string`

The account address that owns the name.

### pointers

- **Type:** `Array<{ key: string; id: string }>`

Name pointers mapping keys to addresses or data.

### ttl

- **Type:** `number`

Absolute TTL (block height) at which the name expires.

## Parameters

### name

- **Type:** `string`
- **Required**

The AENS name to look up (e.g. `'myname.chain'`).

### networkId

- **Type:** `string`
- **Optional**

Target network. Defaults to the currently active network.

## Error Types

```typescript
import type { GetNameEntryErrorType } from '@growae/reactive'
```

`GetNameEntryErrorType` is `BaseErrorType | ErrorType` — a plain `Error` at the
type level. `getNameEntry` returns the node's entry and wraps none of the node's
failures in a package error class, so what it raises is:

- `NetworkNotConfiguredError` — `networkId` was passed and is not in `createConfig({ networks })`
- The `@aeternity/aepp-sdk` node error, unwrapped, when `getNameEntryByName` rejects. A name that is not registered arrives this way, as the node's own 404
