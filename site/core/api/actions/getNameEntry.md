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

- `NameNotFoundError` — the AENS name does not exist
- `NetworkNotConfiguredError` — target network is not in the config
- `NodeRequestError` — the node returned an error
