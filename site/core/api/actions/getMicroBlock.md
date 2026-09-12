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
  pofHash: string
  prevHash: string
  prevKeyHash: string
  stateHash: string
  time: number
  txsHash: string
  version: number
  transactions: any[]
}
```

The micro block header, flattened, plus its transaction list. Every field is
required.

### hash

- **Type:** `string`

The micro block hash (`mh_...`).

### height

- **Type:** `number`

The block height.

### pofHash

- **Type:** `string`

Proof-of-fraud hash. `'no_fraud'` on a block that reports none.

### prevHash

- **Type:** `string`

Hash of the previous block, key or micro.

### prevKeyHash

- **Type:** `string`

Hash of the previous key block (`kh_...`) — the generation this micro block
belongs to.

### stateHash

- **Type:** `string`

State trees root hash after the block was applied.

### time

- **Type:** `number`

The block timestamp, in milliseconds since the epoch. Normalised to a number
whatever form the node reported.

### txsHash

- **Type:** `string`

Root hash of the block's transaction tree.

### version

- **Type:** `number`

Protocol version the block was produced under.

### transactions

- **Type:** `any[]`

The transactions included in the micro block, as the node returned them.

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

`GetMicroBlockErrorType` is `BaseErrorType | ErrorType` — a plain `Error` at the
type level. What the action raises:

- `NetworkNotConfiguredError` — `networkId` was passed and is not in `createConfig({ networks })`
- The `@aeternity/aepp-sdk` node error, unwrapped, from either of the two node calls the action makes. A `hash` the node does not know arrives this way, as its own 404
