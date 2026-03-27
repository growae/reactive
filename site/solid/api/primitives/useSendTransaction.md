# useSendTransaction

Primitive for sending a signed transaction to the network.

## Import

```typescript
import { useSendTransaction } from '@growae/reactive-solid'
```

## Usage

```tsx
import { useSendTransaction } from '@growae/reactive-solid'

function SendTx() {
  const sendTx = useSendTransaction()

  return (
    <button onClick={() => sendTx.mutate({ tx: signedTx })} disabled={sendTx.isPending}>
      Send Transaction
    </button>
  )
}
```

## Parameters

### ttl

- **Type:** `number`
- **Default:** `300`

Transaction TTL in blocks relative to current height. Set to `0` for no expiration.

::: tip Default TTL
All transactions default to a TTL of 300 blocks (~15 hours). This prevents stale transactions from lingering indefinitely. Override with `ttl: 0` for no expiration.
:::

## Action

- [`sendTransaction`](/core/api/actions/sendTransaction)
