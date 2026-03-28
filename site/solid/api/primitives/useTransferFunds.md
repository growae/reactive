# useTransferFunds

Primitive for transferring a fraction of account balance to a recipient.

## Import

```typescript
import { useTransferFunds } from '@growae/reactive-solid'
```

## Usage

```tsx
import { useTransferFunds } from '@growae/reactive-solid'

function TransferHalf() {
  const transferFunds = useTransferFunds()

  return (
    <div>
      <button
        onClick={() =>
          transferFunds.mutate({ fraction: 0.5, recipient: 'ak_...' })
        }
        disabled={transferFunds.isPending}
      >
        Transfer 50%
      </button>
      <Show when={transferFunds.isSuccess}>
        <p>Tx: {transferFunds.data?.hash}</p>
      </Show>
    </div>
  )
}
```

## Parameters

See [`transferFunds` Parameters](/core/api/actions/transferFunds#parameters).

Key parameters:

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `fraction` | `number` | — | Required. Fraction of balance to transfer (0–1). |
| `recipient` | `string` | — | Required. Recipient address (`ak_...`). |
| `ttl` | `number` | `300` | Transaction TTL in blocks. |
| `waitMined` | `boolean` | `true` | Whether to wait for the transaction to be mined. |

## Action

- [`transferFunds`](/core/api/actions/transferFunds)
