# useReadContract

Hook for reading Sophia contract state via dry-run (no transaction, no fees).

## Import

```typescript
import { useReadContract } from '@growae/reactive-react'
```

## Usage

```tsx
import { useReadContract } from '@growae/reactive-react'

function TokenBalance() {
  const { data: balance } = useReadContract({
    address: 'ct_token...',
    aci: tokenAci,
    fn: 'balance',
    args: ['ak_owner...'],
  })

  return <div>Token balance: {balance?.toString()}</div>
}
```

## Return Type

See [TanStack Query query docs](https://tanstack.com/query/v5/docs/framework/react/reference/useQuery) for full return type.

### data

The return type depends on the contract function's Sophia return type.

## Parameters

See [`readContract` Parameters](/core/api/actions/readContract#parameters).

### query

See [TanStack Query query docs](https://tanstack.com/query/v5/docs/framework/react/reference/useQuery) for query options.

## Action

- [`readContract`](/core/api/actions/readContract)
