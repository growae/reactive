# waitForTransactionConfirm

Waits for a transaction to reach a confirmation depth.

## Import

```typescript
import { waitForTransactionConfirm } from '@growae/reactive/actions'
```

## Usage

```typescript
import { waitForTransactionConfirm } from '@growae/reactive/actions'

const confirmedHeight = await waitForTransactionConfirm(config, {
  hash: 'th_2dATGVvfU1oBShDDsaqfh1sF4bCkx2FKbiCaL2t4zZpMMpMfgE',
})
```

## Return Type

```typescript
type WaitForTransactionConfirmReturnType = number
```

The block height at which the transaction reached the required confirmation depth.

## Parameters

### hash

- **Type:** `string`
- **Required**

The transaction hash to wait for.

### networkId

- **Type:** `string`
- **Optional**

Target network. Defaults to the currently active network.

### confirm

- **Type:** `number`
- **Default:** `3`

Number of key blocks to wait for confirmation.

### interval

- **Type:** `number`
- **Default:** `1000`

Polling interval in milliseconds.

## Error Types

```typescript
import type { WaitForTransactionConfirmErrorType } from '@growae/reactive'
```

`WaitForTransactionConfirmErrorType` is `BaseErrorType | ErrorType` — a plain
`Error` at the type level, and both of this action's own guards are literal
plain `Error`s that `instanceof BaseError` does not narrow:

- `Error('Transaction <hash> is not yet mined')` — the node knows the hash but it has no block height yet. This action waits for *confirmations* on an already-mined transaction; it is not an entry point for waiting on inclusion
- `Error('Transaction <hash> was removed from the chain (fork)')` — the transaction had a block height on the first read and none on the recheck

It also raises:

- `NetworkNotConfiguredError` — `networkId` was passed and is not in `createConfig({ networks })`

Any other node failure surfaces unwrapped. A hash the node has never seen
arrives that way, as its own 404 from `getTransactionByHash`.
