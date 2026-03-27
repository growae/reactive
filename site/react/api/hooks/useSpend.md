# useSpend

Hook for sending AE tokens to a recipient.

## Import

```typescript
import { useSpend } from '@reactive/react'
```

## Usage

```tsx
import { useSpend } from '@reactive/react'

function SendAE() {
  const { mutate: spend, isPending, isSuccess, data } = useSpend()

  return (
    <div>
      <button
        onClick={() =>
          spend({
            recipient: 'ak_2dA...',
            amount: '1.5',
          })
        }
        disabled={isPending}
      >
        Send 1.5 AE
      </button>
      {isSuccess && <p>Tx: {data.hash}</p>}
    </div>
  )
}
```

## Return Type

See [TanStack Query mutation docs](https://tanstack.com/query/v5/docs/framework/react/reference/useMutation) for full return type.

### data

See [`spend` Return Type](/core/api/actions/spend#return-type).

## Parameters

See [`spend` Parameters](/core/api/actions/spend#parameters) for all available options.

Key parameters:

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `recipient` | `string` | — | Required. Recipient address or AENS name. |
| `amount` | `bigint \| string` | — | Required. Amount to send. |
| `ttl` | `number` | `300` | Transaction TTL in blocks relative to current height. Set to `0` for no expiration. |

::: tip Default TTL
All transactions default to a TTL of 300 blocks (~15 hours). This prevents stale transactions from lingering indefinitely. Override with `ttl: 0` for no expiration.
:::

### mutation

See [TanStack Query mutation docs](https://tanstack.com/query/v5/docs/framework/react/reference/useMutation) for mutation options.

## Action

- [`spend`](/core/api/actions/spend)
