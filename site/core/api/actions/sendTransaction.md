# sendTransaction

Sends an arbitrary signed transaction to the network. This is the low-level primitive — most users should prefer higher-level actions like `spend`, `callContract`, etc.

## Import

```typescript
import { sendTransaction } from '@growae/reactive/actions'
```

## Usage

```typescript
import { sendTransaction } from '@growae/reactive/actions'

const result = await sendTransaction(config, {
  tx: signedTx,
})
```

## Return Type

```typescript
type SendTransactionReturnType = {
  hash: string
  rawTx: string
  blockHash?: string
  blockHeight?: number
  tx?: Record<string, any>
}
```

### hash

- **Type:** `string`

The transaction hash (`th_...`).

### rawTx

- **Type:** `string`

The transaction that was posted, exactly as it was passed in.

### blockHash

- **Type:** `string`
- **Optional**

Hash of the key block the transaction was mined into (`kh_...`). Present only
when `waitMined` was `true`.

### blockHeight

- **Type:** `number`
- **Optional**

Height of that block. Present only when `waitMined` was `true`.

### tx

- **Type:** `Record<string, any>`
- **Optional**

The decoded transaction body. Present only when `waitMined` was `true`.

## Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `tx` | `string` | — | Required. The signed transaction (`tx_...`) to broadcast. |
| `networkId` | `string` | active | Target network. |
| `waitMined` | `boolean` | `false` | Wait for the transaction to be mined before resolving. |
| `timeout` | `number` | `DEFAULT_WAIT_TIMEOUT` | Upper bound in milliseconds on that wait. Ignored when `waitMined` is not set. |

`sendTransaction` carries no TTL parameter. A transaction's TTL is fixed when it
is built and signed, which happens before this action is reached — set it on
whichever action built the transaction, or on `buildTransaction`.

`sendTransaction` does not sign. It posts the transaction it is given, so a
transaction that has not been through `signTransaction` or a connector is
rejected by the node.

::: tip `waitMined` defaults to `false`
This is the low-level primitive: by default it resolves as soon as the node
accepts the transaction, to a hash rather than to an included transaction. Pass
`waitMined: true` to wait for inclusion and receive `blockHash`, `blockHeight`
and `tx` alongside it. Higher-level actions built on this one — `transferFunds`
— default the other way.
:::

The wait is always bounded. `DEFAULT_WAIT_TIMEOUT` is 20 minutes, comfortably
past the handful of key blocks a transaction takes to be included and far short
of `DEFAULT_TTL`'s ~15 hours, so a transaction that never lands rejects rather
than pending forever. For finer control over the polling itself — how many
blocks to allow, how often to poll — call `waitForTransaction` directly.

## Examples

### Wait for the transaction to be mined

```typescript
import { sendTransaction } from '@growae/reactive/actions'

const result = await sendTransaction(config, {
  tx: signedTx,
  waitMined: true,
})

console.log(result.blockHeight)
```

### Wait for the transaction to be confirmed

Inclusion is not finality. To wait for confirmations on top of it:

```typescript
import {
  sendTransaction,
  waitForTransactionConfirm,
} from '@growae/reactive/actions'

const result = await sendTransaction(config, { tx: signedTx })

await waitForTransactionConfirm(config, {
  hash: result.hash,
  confirm: 3,
})
```

## Error Types

```typescript
import type { SendTransactionErrorType } from '@growae/reactive'
```

`SendTransactionErrorType` is `BaseErrorType | ErrorType` — a plain `Error` at
the type level. What the action raises:

- `NetworkNotConfiguredError` — `networkId` was passed and is not in `createConfig({ networks })`
- The `@aeternity/aepp-sdk` node error, unwrapped, when `postTransaction` rejects. A transaction the node refuses — bad signature, wrong nonce, expired TTL, insufficient balance — arrives this way, carrying the node's own reason

With `waitMined: true`, two further plain `Error`s can be raised after the
transaction has already been posted, by the `waitForTransaction` call underneath:

- `Error('Waiting for transaction <hash> timed out after <ms>ms')` — the transaction was not mined within `timeout`
- `Error('Transaction <hash> was not mined within <n> blocks')` — the transaction carries no TTL and did not land within the block bound

Both mean the transaction is posted and its hash is known; only the wait ended.
Neither is a guarantee that the transaction will not be mined later — check with
`getTransaction` or `waitForTransaction` before resending anything.

`sendTransaction` posts an already-signed transaction. It never reaches the
connector, so it raises nothing about a missing or unsupported wallet.
