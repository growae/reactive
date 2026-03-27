# useSendTransaction

Hook for sending a signed transaction to the network.

## Import

```typescript
import { useSendTransaction } from '@reactive/react'
```

## Usage

```tsx
import { useSendTransaction } from '@reactive/react'

function SendTx() {
  const { mutate: send, data, isPending } = useSendTransaction()

  return (
    <button onClick={() => send({ tx: signedTx })} disabled={isPending}>
      Send Transaction
    </button>
  )
}
```

## Return Type

See [TanStack Query mutation docs](https://tanstack.com/query/v5/docs/framework/react/reference/useMutation) for full return type.

### data

See [`sendTransaction` Return Type](/core/api/actions/sendTransaction#return-type).

## Parameters

### tx

- **Type:** `string`
- **Required**

The signed transaction.

### ttl

- **Type:** `number`
- **Default:** `300`

Transaction TTL in blocks relative to current height. Set to `0` for no expiration.

::: tip Default TTL
All transactions default to a TTL of 300 blocks (~15 hours). This prevents stale transactions from lingering indefinitely. Override with `ttl: 0` for no expiration.
:::

### mutation

See [TanStack Query mutation docs](https://tanstack.com/query/v5/docs/framework/react/reference/useMutation) for mutation options.

## Action

- [`sendTransaction`](/core/api/actions/sendTransaction)
