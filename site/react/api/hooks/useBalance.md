# useBalance

Hook for fetching the AE balance of an address.

## Import

```typescript
import { useBalance } from '@reactive/react'
```

## Usage

```tsx
import { useBalance } from '@reactive/react'

function Balance() {
  const { data, isLoading, error } = useBalance({
    address: 'ak_2dATGVvfU1oBShDDsaqfh1sF4bCkx2FKbiCaL2t4zZpMMpMfgE',
  })

  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Error: {error.shortMessage}</div>

  return (
    <div>
      <p>{data.ae} AE</p>
      <p>{data.aettos.toString()} aettos</p>
    </div>
  )
}
```

## Return Type

See [TanStack Query query docs](https://tanstack.com/query/v5/docs/framework/react/reference/useQuery) for full return type.

### data

See [`getBalance` Return Type](/core/api/actions/getBalance#return-type).

## Parameters

### address

- **Type:** `string`
- **Required**

The account address (`ak_...`) to query.

### networkId

- **Type:** `string`
- **Optional**

Target network. Defaults to currently active network.

### query

See [TanStack Query query docs](https://tanstack.com/query/v5/docs/framework/react/reference/useQuery) for query options.

## Action

- [`getBalance`](/core/api/actions/getBalance)
