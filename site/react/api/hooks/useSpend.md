# useSpend

Send AE to a recipient. Provide the amount in aettos. The action builds and prices the transaction with Rust, asks the selected connector to sign, and submits the signed bytes to the node.

## Import

```typescript
import { useSpend } from '@growae/reactive-react'
```

## Usage

```tsx
import { useSpend } from '@growae/reactive-react'

function SendAE() {
  const { mutate: spend, isPending, isSuccess, data } = useSpend()

  return (
    <div>
      <button
        onClick={() =>
          spend({
            recipient: 'ak_2dA...',
            amount: 1500000000000000000n,
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
| `options.ttl` | `number` | current height + 300 | Transaction absolute expiry height. Use `0` for no expiry. |

::: tip Default TTL
Spends default to an expiry 300 key blocks after the current height. Pass `options: { ttl: 0 }` to disable expiry.
:::

### mutation

See [TanStack Query mutation docs](https://tanstack.com/query/v5/docs/framework/react/reference/useMutation) for mutation options.

## Action

- [`spend`](/core/api/actions/spend)
