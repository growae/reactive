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
}
```

### hash

- **Type:** `string`

The transaction hash.

### rawTx

- **Type:** `string`

The signed transaction.

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

Forwarded to `sendTransaction`, which does not currently read it — see that
action's page. `transferFunds` returns as soon as the node accepts the
transaction.

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
- `NetworkNotConfiguredError` — `networkId` was passed and is not in `createConfig({ networks })`

Everything else surfaces unwrapped, from the three calls this action delegates
to: `getBalance`, the SDK's transaction building, and `sendTransaction`.
`transferFunds` subtracts the estimated fee from the amount rather than letting
the balance be exceeded, so an underfunded transfer is a smaller transfer, not
an error.
