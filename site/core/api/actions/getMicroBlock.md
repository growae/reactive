# getMicroBlock

Fetches a micro block by hash.

## Import

```typescript
import { getMicroBlock } from '@growae/reactive/actions'
```

## Usage

```typescript
import { getMicroBlock } from '@growae/reactive/actions'

const block = await getMicroBlock(config, {
  hash: 'mh_2dATGVvfU1oBShDDsaqfh1sF4bCkx2FKbiCaL2t4zZpMMpMfgE',
})
```

## Return Type

```typescript
type GetMicroBlockReturnType = {
  hash: string
  height: number
  time: number
  transactions: Array<unknown>
}
```

### hash

- **Type:** `string`

The micro block hash.

### height

- **Type:** `number`

The block height.

### time

- **Type:** `number`

The block timestamp.

### transactions

- **Type:** `Array<unknown>`

List of transactions included in the micro block.

## Parameters

### hash

- **Type:** `string`
- **Required**

The micro block hash to fetch.

### networkId

- **Type:** `string`
- **Optional**

Target network. Defaults to the currently active network.

## Error Types

```typescript
import type { GetMicroBlockErrorType } from '@growae/reactive'
```

- `NetworkNotConfiguredError` — target network is not in the config
- `NodeRequestError` — the node returned an error
