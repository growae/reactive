# useBalance

Hook for fetching the AE balance of an address.

## Import

```typescript
import { useBalance } from '@growae/reactive-react'
```

## Usage

```tsx
import { useBalance } from '@growae/reactive-react'

function Balance() {
  // Uses the connected active account automatically when address is omitted
  const { data, isLoading, error } = useBalance()

  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Error: {error.shortMessage}</div>

  return (
    <div>
      <p>{data} AE</p>
    </div>
  )
}

// Or query a specific address
function SpecificBalance() {
  const { data } = useBalance({
    address: 'ak_2dATGVvfU1oBShDDsaqfh1sF4bCkx2FKbiCaL2t4zZpMMpMfgE',
  })
  return <div>{data}</div>
}
```

## Return Type

See [TanStack Query query docs](https://tanstack.com/query/v5/docs/framework/react/reference/useQuery) for full return type.

### data

See [`getBalance` Return Type](/core/api/actions/getBalance#return-type).

## Parameters

### address

- **Type:** `string`
- **Optional**

The account address (`ak_...`) to query. Defaults to the connected active account from [`useActiveAccount`](/react/api/hooks/useActiveAccount). The query is disabled when no address is available.

### networkId

- **Type:** `string`
- **Optional**

Target network. Defaults to currently active network.

### query

See [TanStack Query query docs](https://tanstack.com/query/v5/docs/framework/react/reference/useQuery) for query options.

## Action

- [`getBalance`](/core/api/actions/getBalance)
