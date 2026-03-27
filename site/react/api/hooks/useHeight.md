# useHeight

Hook for fetching the current block height of the Aeternity network.

## Import

```typescript
import { useHeight } from '@reactive/react'
```

## Usage

```tsx
import { useHeight } from '@reactive/react'

function BlockHeight() {
  const { data: height, isLoading } = useHeight()

  if (isLoading) return <div>Loading...</div>
  return <div>Current height: {height}</div>
}
```

## Return Type

See [TanStack Query query docs](https://tanstack.com/query/v5/docs/framework/react/reference/useQuery) for full return type.

### data

- **Type:** `number`

The current key block height.

## Parameters

### networkId

- **Type:** `string`
- **Optional**

Target network.

### query

See [TanStack Query query docs](https://tanstack.com/query/v5/docs/framework/react/reference/useQuery) for query options.
