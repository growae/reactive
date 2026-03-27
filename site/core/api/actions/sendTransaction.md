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
}
```

## Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `tx` | `string` | — | Required. The signed transaction to broadcast. |
| `ttl` | `number` | `300` | Transaction TTL in blocks relative to current height. Set to `0` for no expiration. |
| `waitForConfirmation` | `boolean` | `false` | Wait for the transaction to be mined before returning. |
| `confirmationBlocks` | `number` | `1` | Number of blocks to wait when `waitForConfirmation` is true. |

::: tip Default TTL
All transactions default to a TTL of 300 blocks (~15 hours). This prevents stale transactions from lingering indefinitely. Override with `ttl: 0` for no expiration.
:::

## Examples

### Wait for confirmation

```typescript
const result = await sendTransaction(config, {
  tx: signedTx,
  waitForConfirmation: true,
  confirmationBlocks: 3,
})
```

## Error Types

```typescript
import type { SendTransactionErrorType } from '@growae/reactive'
```

- `ConnectorNotConnectedError` — no wallet connected
- `TransactionRejectedError` — node rejected the transaction
- `TransactionExpiredError` — TTL exceeded before inclusion
