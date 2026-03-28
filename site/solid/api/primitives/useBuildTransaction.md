# useBuildTransaction

Primitive for building unsigned transactions.

## Import

```typescript
import { useBuildTransaction } from '@growae/reactive-solid'
```

## Usage

```tsx
import { useBuildTransaction } from '@growae/reactive-solid'
import { Tag } from '@aeternity/aepp-sdk'

function BuildTx() {
  const buildTransaction = useBuildTransaction()

  return (
    <div>
      <button
        onClick={() =>
          buildTransaction.mutate({
            tag: Tag.SpendTx,
            senderId: 'ak_...',
            recipientId: 'ak_...',
            amount: 1000000000000000000n,
          })
        }
      >
        Build Transaction
      </button>
      <Show when={buildTransaction.data}>
        <p>Unsigned Tx: {buildTransaction.data}</p>
      </Show>
    </div>
  )
}
```

## Parameters

See [`buildTransaction` Parameters](/core/api/actions/buildTransaction#parameters).

Key parameters:

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `tag` | `Tag` | — | Required. Transaction type tag (e.g. `Tag.SpendTx`). |
| `networkId` | `string` | — | Optional. Target network. |

Additional transaction-specific fields depend on the chosen `tag`.

## Action

- [`buildTransaction`](/core/api/actions/buildTransaction)
