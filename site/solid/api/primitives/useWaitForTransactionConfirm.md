# useWaitForTransactionConfirm

Primitive that waits for a transaction to reach a confirmation depth.

## Import

```typescript
import { useWaitForTransactionConfirm } from '@growae/reactive-solid'
```

## Usage

```tsx
import { useWaitForTransactionConfirm } from '@growae/reactive-solid'
import { Show } from 'solid-js'

function TxConfirmation(props: { txHash: string }) {
  const confirmation = useWaitForTransactionConfirm({
    hash: () => props.txHash,
  })

  return (
    <Show when={!confirmation.isLoading} fallback={<div>Waiting for confirmation...</div>}>
      <div>Confirmed at height: {confirmation.data}</div>
    </Show>
  )
}
```

## Return Type

### data

- **Type:** `Accessor<number | undefined>`

The block height at which the transaction reached the required confirmation depth.

## Parameters

### hash

- **Type:** `string | Accessor<string>`
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

See [TanStack Solid Query docs](https://tanstack.com/query/v5/docs/framework/solid/reference/createQuery) for query options.

## Action

- [`waitForTransactionConfirm`](/core/api/actions/waitForTransactionConfirm)
