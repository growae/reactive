# transferFunds

Transfers a fraction of the account balance to a recipient.

## Import

```typescript
import { transferFunds } from '@growae/reactive/actions'
```

## Usage

```typescript
import { transferFunds } from '@growae/reactive/actions'

const result = await transferFunds(config, {
  fraction: 0.5,
  recipient: 'ak_2dATGVvfU1oBShDDsaqfh1sF4bCkx2FKbiCaL2t4zZpMMpMfgE',
})
```

## Return Type

```typescript
type TransferFundsReturnType = {
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

The signed transaction (`tx_...`).

`blockHash`, `blockHeight` and `tx` describe the mined transaction. All three
are populated on the default path, where `waitMined` is `true`. They are
`undefined` when `waitMined: false` is passed, because there is then no mined
transaction to read them from.

### blockHash

- **Type:** `string`
- **Optional**

Hash of the key block the transaction was mined into (`kh_...`).

### blockHeight

- **Type:** `number`
- **Optional**

Height of that block.

### tx

- **Type:** `Record<string, any>`
- **Optional**

The decoded transaction body.

## Parameters

### fraction

- **Type:** `number`
- **Required**

Fraction of the balance to transfer, between 0 and 1 (e.g. `0.5` for 50%).

### recipient

- **Type:** `string`
- **Required**

Recipient address (`ak_...`).

### networkId

- **Type:** `string`
- **Optional**

Target network. Defaults to the currently active network.

### connector

- **Type:** `Connector`
- **Optional**

Connector to transfer from. Defaults to the active connection's connector, and
the sender address is then that connection's active account.

### ttl

- **Type:** `number`
- **Default:** `300`

Transaction TTL in blocks relative to current height. Set to `0` for no expiration.

### waitMined

- **Type:** `boolean`
- **Default:** `true`

Wait for the transfer to be mined before resolving. This is what populates
`blockHash`, `blockHeight` and `tx`. Pass `false` to return as soon as the node
accepts the transaction, in which case those three fields are `undefined`.

### timeout

- **Type:** `number`
- **Default:** `DEFAULT_WAIT_TIMEOUT`

Upper bound in milliseconds on the `waitMined` wait — 20 minutes by default, so
a transfer that never lands rejects rather than pending indefinitely.

## Error Types

```typescript
import type { TransferFundsErrorType } from '@growae/reactive'
```

`TransferFundsErrorType` is `BaseErrorType | ErrorType` — a plain `Error` at the
type level, and three of the four guards below are literal plain `Error`s that
`instanceof BaseError` does not narrow. In the order the action can raise them:

- `Error('Invalid fraction: <n>. Must be between 0 and 1.')` — `fraction` is outside `[0, 1]`
- `Error('No connector found. Connect a wallet first.')` — no `connector` was passed and nothing is connected
- `Error('No account available on the current connector.')` — the connector reported no accounts
- `Error('Connector does not support transaction signing.')` — raised by the `signTransaction` delegation, after the two guards above, when the connector exposes no `signTransaction`
- `NetworkNotConfiguredError` — `networkId` was passed and is not in `createConfig({ networks })`

On the default path, two further plain `Error`s can be raised after the
transaction has already been posted, by the `waitForTransaction` call
underneath `sendTransaction`:

- `Error('Waiting for transaction <hash> timed out after <ms>ms')` — the transfer was not mined within `timeout`
- `Error('Transaction <hash> was not mined within <n> blocks')` — the transaction carries no TTL and did not land within the block bound

Both mean the transfer is posted and on its way; only the wait ended. Do not
resend on either without checking `getTransaction` first.

Everything else surfaces unwrapped, from the four calls this action delegates
to: `getBalance`, the SDK's transaction building, `signTransaction`, and
`sendTransaction`.
`transferFunds` subtracts the estimated fee from the amount rather than letting
the balance be exceeded, so an underfunded transfer is a smaller transfer, not
an error.
