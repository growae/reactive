# spend

Sends AE tokens to a recipient address.

## Import

```typescript
import { spend } from '@growae/reactive/actions'
```

## Usage

```typescript
import { spend } from '@growae/reactive/actions'

const result = await spend(config, {
  recipient: 'ak_2dATGVvfU1oBShDDsaqfh1sF4bCkx2FKbiCaL2t4zZpMMpMfgE',
  amount: 1500000000000000000n, // 1.5 AE, in aettos
})
```

## Return Type

```typescript
type SpendReturnType = {
  hash: string
  rawTx: string
}
```

## Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `recipient` | `string` | — | Required. Recipient address (`ak_...` or AENS name). |
| `amount` | `bigint \| string` | — | Required. Amount to send, in aettos. |
| `payload` | `string` | — | Payload data attached to the transaction. Omitted from the transaction when absent. |
| `networkId` | `string` | active | Target network. |
| `options.fee` | `bigint` | auto | Transaction fee in aettos. Auto-calculated if omitted. |
| `options.ttl` | `number` | `300` | Transaction TTL in blocks relative to current height. Set to `0` for no expiration. |
| `options.nonce` | `number` | auto | Account nonce. Read from the node if omitted. |

`fee`, `ttl` and `nonce` live under `options`; there is no top-level form of
any of them.

::: warning `amount` is aettos, in both forms
A string `amount` is passed through `BigInt()`, so it is aettos exactly as a
`bigint` is and must be a whole number — `'1.5'` throws, and `'5'` sends five
aettos, not five AE.
:::

::: tip Default TTL
All transactions default to a TTL of 300 blocks (~15 hours). This prevents stale transactions from lingering indefinitely. Override with `options: { ttl: 0 }` for no expiration.
:::

## Examples

### Send with custom TTL

```typescript
const result = await spend(config, {
  recipient: 'ak_2dA...',
  amount: 10000000000000000000n, // 10 AE
  options: { ttl: 50 }, // 50 blocks (~2.5 hours)
})
```

### Send with a payload

```typescript
const result = await spend(config, {
  recipient: 'ak_2dA...',
  amount: 1000000000000000000n, // 1 AE in aettos
  payload: 'ba_aW52b2ljZSAjNDI=',
})
```

### Send to AENS name

```typescript
const result = await spend(config, {
  recipient: 'alice.chain',
  amount: 5000000000000000000n, // 5 AE
})
```

## Error Types

```typescript
import type { SpendErrorType } from '@growae/reactive'
```

`SpendErrorType` is `BaseErrorType | ErrorType` — a plain `Error` at the type
level, and three of the four guards below are literal plain `Error`s that
`instanceof BaseError` does not narrow. In the order the action can raise them:

- `Error('No connected account')` — nothing is connected
- `NetworkNotConfiguredError` — `networkId` was passed and is not in `createConfig({ networks })`
- `Error('No account available')` — the connection carries no active account
- `Error('Connector does not support transaction signing')` — the connector has no `signTransaction`

Everything else surfaces unwrapped: the node's error from
`getAccountByPubkey` and `postTransaction`, the SDK's from building the spend
transaction, and the connector's from signing. An account without enough AE to
cover `amount` plus the fee is refused by the node when the transaction is
posted, and arrives as the node's own error carrying its reason.
