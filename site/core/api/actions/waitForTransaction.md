# waitForTransaction

Waits for a transaction to be mined, and resolves to the included transaction.

## Import

```typescript
import { waitForTransaction } from '@growae/reactive/actions'
```

## Usage

```typescript
import { waitForTransaction } from '@growae/reactive/actions'

const mined = await waitForTransaction(config, {
  hash: 'th_2dATGVvfU1oBShDDsaqfh1sF4bCkx2FKbiCaL2t4zZpMMpMfgE',
})
```

## Return Type

```typescript
type WaitForTransactionReturnType = {
  hash: string
  blockHash: string
  blockHeight: number
  tx: Record<string, any>
}
```

The transaction as the node returned it once it had a block height.

## The wait is always bounded

Polling ends on the first of these to happen — the transaction is mined, the
block bound passes, the transaction's ttl height passes, or `timeout` elapses.
Which bounds are in play depends on what you pass:

| You pass | What bounds the wait |
| --- | --- |
| neither `blocks` nor `timeout` | `blocks`, defaulting to 5 key blocks |
| `timeout` only | `timeout` — your own bound, which the default `blocks` does not tighten |
| `blocks` only | `blocks`, as you set it |
| both | both; whichever fires first |

A transaction's ttl caps the wait on top of all four rows, whenever it is
nearer than the bound above. It is not a timeout: past its ttl height a
transaction can never be mined, so there is nothing left to wait for. The two
failures are worth telling apart — a ttl that has passed is terminal and the
same signed transaction will never land, while a block bound that has passed
is not, and the transaction may still be included in a later block.

Every action in this library builds transactions with `DEFAULT_TTL`, which is
300 key blocks — roughly 15 hours. That is the ceiling, not the wait: on the
default call the 5-block bound is what you will hit.

## Parameters

### hash

- **Type:** `string`
- **Required**

The transaction hash to wait for.

### networkId

- **Type:** `string`
- **Optional**

Target network. Defaults to the currently active network.

### blocks

- **Type:** `number`
- **Default:** `5`

How many key blocks past the current height to keep waiting. Applies when you
pass it, and when you pass no bound at all; passing `timeout` on its own
replaces it rather than adding to it.

### interval

- **Type:** `number`
- **Default:** `1000`

Polling interval in milliseconds.

### timeout

- **Type:** `number`
- **Optional**

Wall-clock bound in milliseconds. Unbounded by default, in the sense that the
bound is then taken in blocks instead.

## Examples

### Wait longer than the default

```typescript
const mined = await waitForTransaction(config, {
  hash: 'th_2dATGVvfU1oBShDDsaqfh1sF4bCkx2FKbiCaL2t4zZpMMpMfgE',
  blocks: 20,
  interval: 2_000,
})
```

### Bound the wait in wall-clock time

```typescript
const mined = await waitForTransaction(config, {
  hash: 'th_2dATGVvfU1oBShDDsaqfh1sF4bCkx2FKbiCaL2t4zZpMMpMfgE',
  timeout: 5 * 60 * 1000,
})
```

## Error Types

```typescript
import type { WaitForTransactionErrorType } from '@growae/reactive'
```

`WaitForTransactionErrorType` is `BaseErrorType | ErrorType` — a plain `Error`
at the type level, and all three of this action's own bounds throw a literal
plain `Error` that `instanceof BaseError` does not narrow:

- `Error('Transaction <hash> expired unmined: its ttl height <height> has passed')` — terminal; the transaction is past its ttl and can never be mined
- `Error('Transaction <hash> was not mined within <n> blocks')` — not terminal; the transaction is still valid and may be included later
- `Error('Waiting for transaction <hash> timed out after <n>ms')` — the `timeout` you passed elapsed

::: warning These message strings are not a stable API
They are not yet backed by typed error classes, so do not match on them. When
this action's errors become `BaseError` subclasses the strings may change with
them.
:::

It also raises:

- `NetworkNotConfiguredError` — `networkId` was passed and is not in `createConfig({ networks })`

Any other node failure surfaces unwrapped. A hash the node has never seen
arrives that way, as its own 404 from `getTransactionByHash`.
