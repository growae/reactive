# useWaitForTransactionConfirm

Hook that waits for a transaction to reach a confirmation depth.

## Import

```typescript
import { useWaitForTransactionConfirm } from '@growae/reactive-react'
```

## Usage

```tsx
import { useWaitForTransactionConfirm } from '@growae/reactive-react'

function TxConfirmation({ txHash }: { txHash: string }) {
  const { data: confirmedHeight, isLoading } = useWaitForTransactionConfirm({
    hash: txHash,
  })

  if (isLoading) return <div>Waiting for confirmation...</div>
  return <div>Confirmed at height: {confirmedHeight}</div>
}
```

## Return Type

See [TanStack Query query docs](https://tanstack.com/query/v5/docs/framework/react/reference/useQuery) for full return type.

### data

- **Type:** `number`

The block height at which the transaction reached the required confirmation depth.

## Parameters

### hash

- **Type:** `string`
- **Required**

The transaction hash to wait for. The query auto-runs when `hash` is provided.

### confirm

- **Type:** `number`
- **Default:** `3`

Number of key blocks to wait for confirmation.

### interval

- **Type:** `number`
- **Default:** `1000`

Polling interval in milliseconds.

### query

See [TanStack Query query docs](https://tanstack.com/query/v5/docs/framework/react/reference/useQuery) for query options.

## Action

- [`waitForTransactionConfirm`](/core/api/actions/waitForTransactionConfirm)
