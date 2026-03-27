# spend

Sends AE tokens to a recipient address.

## Import

```typescript
import { spend } from '@reactive/core/actions'
```

## Usage

```typescript
import { spend } from '@reactive/core/actions'

const result = await spend(config, {
  recipient: 'ak_2dATGVvfU1oBShDDsaqfh1sF4bCkx2FKbiCaL2t4zZpMMpMfgE',
  amount: '1.5', // in AE
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
| `amount` | `bigint \| string` | — | Required. Amount to send. Strings are parsed as AE, bigints as aettos. |
| `ttl` | `number` | `300` | Transaction TTL in blocks relative to current height. Set to `0` for no expiration. |
| `nonce` | `number` | auto | Account nonce. Auto-fetched if omitted. |
| `fee` | `bigint` | auto | Transaction fee in aettos. Auto-calculated if omitted. |
| `payload` | `string` | `''` | Optional payload data attached to the transaction. |

::: tip Default TTL
All transactions default to a TTL of 300 blocks (~15 hours). This prevents stale transactions from lingering indefinitely. Override with `ttl: 0` for no expiration.
:::

## Examples

### Send with custom TTL

```typescript
const result = await spend(config, {
  recipient: 'ak_2dA...',
  amount: '10',
  ttl: 50, // 50 blocks (~2.5 hours)
})
```

### Send exact aettos

```typescript
const result = await spend(config, {
  recipient: 'ak_2dA...',
  amount: 1000000000000000000n, // 1 AE in aettos
})
```

### Send to AENS name

```typescript
const result = await spend(config, {
  recipient: 'alice.chain',
  amount: '5',
})
```

## Error Types

```typescript
import type { SpendErrorType } from '@reactive/core'
```

- `ConnectorNotConnectedError` — no wallet connected
- `InsufficientBalanceError` — not enough AE
- `NodeRequestError` — the node returned an error
