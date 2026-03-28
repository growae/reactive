# useMicroBlock

Hook for fetching a micro block by hash.

## Import

```typescript
import { useMicroBlock } from '@growae/reactive-react'
```

## Usage

```tsx
import { useMicroBlock } from '@growae/reactive-react'

function MicroBlockInfo({ blockHash }: { blockHash: string }) {
  const { data: block, isLoading } = useMicroBlock({ hash: blockHash })

  if (isLoading) return <div>Loading...</div>
  return (
    <div>
      <p>Height: {block?.height}</p>
      <p>Transactions: {block?.transactions?.length}</p>
    </div>
  )
}
```

## Return Type

See [TanStack Query query docs](https://tanstack.com/query/v5/docs/framework/react/reference/useQuery) for full return type.

### data

See [`getMicroBlock` Return Type](/core/api/actions/getMicroBlock#return-type).

## Parameters

### hash

- **Type:** `string`
- **Required**

The micro block hash to fetch.

### networkId

- **Type:** `string`
- **Optional**

Target network.

### query

See [TanStack Query query docs](https://tanstack.com/query/v5/docs/framework/react/reference/useQuery) for query options.

## Action

- [`getMicroBlock`](/core/api/actions/getMicroBlock)
