# useBuildTransaction

Hook for building unsigned transactions.

## Import

```typescript
import { useBuildTransaction } from '@growae/reactive-react'
```

## Usage

```tsx
import { useBuildTransaction } from '@growae/reactive-react'
import { Tag } from '@aeternity/aepp-sdk'

function BuildTx() {
  const { mutate: buildTransaction, data } = useBuildTransaction()

  return (
    <div>
      <button
        onClick={() =>
          buildTransaction({
            tag: Tag.SpendTx,
            senderId: 'ak_...',
            recipientId: 'ak_...',
            amount: 1000000000000000000n,
          })
        }
      >
        Build Transaction
      </button>
      {data && <p>Unsigned Tx: {data}</p>}
    </div>
  )
}
```

## Return Type

See [TanStack Query mutation docs](https://tanstack.com/query/v5/docs/framework/react/reference/useMutation) for full return type.

### data

See [`buildTransaction` Return Type](/core/api/actions/buildTransaction#return-type).

## Parameters

See [`buildTransaction` Parameters](/core/api/actions/buildTransaction#parameters) for all available options.

Key parameters:

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `tag` | `Tag` | — | Required. Transaction type tag (e.g. `Tag.SpendTx`). |
| `networkId` | `string` | — | Optional. Target network. |

Additional transaction-specific fields depend on the chosen `tag`.

### mutation

See [TanStack Query mutation docs](https://tanstack.com/query/v5/docs/framework/react/reference/useMutation) for mutation options.

## Action

- [`buildTransaction`](/core/api/actions/buildTransaction)
