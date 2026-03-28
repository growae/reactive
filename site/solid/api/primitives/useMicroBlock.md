# useMicroBlock

Primitive for fetching a micro block by hash.

## Import

```typescript
import { useMicroBlock } from '@growae/reactive-solid'
```

## Usage

```tsx
import { useMicroBlock } from '@growae/reactive-solid'
import { Show } from 'solid-js'

function MicroBlockInfo(props: { blockHash: string }) {
  const block = useMicroBlock({ hash: () => props.blockHash })

  return (
    <Show when={!block.isLoading} fallback={<div>Loading...</div>}>
      <div>
        <p>Height: {block.data?.height}</p>
        <p>Transactions: {block.data?.transactions?.length}</p>
      </div>
    </Show>
  )
}
```

## Return Type

### data

- **Type:** `Accessor<{ hash, height, time, transactions, ... } | undefined>`

The micro block data.

## Parameters

### hash

- **Type:** `string | Accessor<string>`
- **Required**

The micro block hash to fetch.

### networkId

- **Type:** `string | Accessor<string>`
- **Optional**

Target network.

### query

See [TanStack Solid Query docs](https://tanstack.com/query/v5/docs/framework/solid/reference/createQuery) for query options.

## Action

- [`getMicroBlock`](/core/api/actions/getMicroBlock)
