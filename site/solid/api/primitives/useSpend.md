# useSpend

Primitive for sending AE tokens to a recipient.

## Import

```typescript
import { useSpend } from '@reactive/solid'
```

## Usage

```tsx
import { useSpend } from '@reactive/solid'

function SendAE() {
  const spend = useSpend()

  return (
    <div>
      <button
        onClick={() =>
          spend.mutate({ recipient: 'ak_2dA...', amount: '1.5' })
        }
        disabled={spend.isPending}
      >
        Send 1.5 AE
      </button>
      <Show when={spend.isSuccess}>
        <p>Tx: {spend.data?.hash}</p>
      </Show>
    </div>
  )
}
```

## Parameters

See [`spend` Parameters](/core/api/actions/spend#parameters).

Key parameters:

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `recipient` | `string` | — | Required. Recipient address or AENS name. |
| `amount` | `bigint \| string` | — | Required. Amount to send. |
| `ttl` | `number` | `300` | Transaction TTL in blocks relative to current height. Set to `0` for no expiration. |

::: tip Default TTL
All transactions default to a TTL of 300 blocks (~15 hours). This prevents stale transactions from lingering indefinitely. Override with `ttl: 0` for no expiration.
:::

## Action

- [`spend`](/core/api/actions/spend)
