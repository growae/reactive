# useTransferFunds

Hook for transferring a fraction of account balance to a recipient.

## Import

```typescript
import { useTransferFunds } from '@growae/reactive-react'
```

## Usage

```tsx
import { useTransferFunds } from '@growae/reactive-react'

function TransferHalf() {
  const { mutate: transferFunds, isPending, isSuccess, data } = useTransferFunds()

  return (
    <div>
      <button
        onClick={() =>
          transferFunds({ fraction: 0.5, recipient: 'ak_...' })
        }
        disabled={isPending}
      >
        Transfer 50%
      </button>
      {isSuccess && <p>Tx: {data.hash}</p>}
    </div>
  )
}
```

## Return Type

See [TanStack Query mutation docs](https://tanstack.com/query/v5/docs/framework/react/reference/useMutation) for full return type.

### data

See [`transferFunds` Return Type](/core/api/actions/transferFunds#return-type).

## Parameters

See [`transferFunds` Parameters](/core/api/actions/transferFunds#parameters) for all available options.

Key parameters:

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `fraction` | `number` | — | Required. Fraction of balance to transfer (0–1). |
| `recipient` | `string` | — | Required. Recipient address (`ak_...`). |
| `ttl` | `number` | `300` | Transaction TTL in blocks. |
| `waitMined` | `boolean` | `true` | Whether to wait for the transaction to be mined. |

### mutation

See [TanStack Query mutation docs](https://tanstack.com/query/v5/docs/framework/react/reference/useMutation) for mutation options.

## Action

- [`transferFunds`](/core/api/actions/transferFunds)
