# useReadContract

Primitive for reading Sophia contract state via dry-run.

## Import

```typescript
import { useReadContract } from '@reactive/solid'
```

## Usage

```tsx
import { useReadContract } from '@reactive/solid'

function TokenBalance() {
  const result = useReadContract({
    address: 'ct_token...',
    aci: tokenAci,
    fn: 'balance',
    args: ['ak_owner...'],
  })

  return <div>Token balance: {result.data?.toString()}</div>
}
```

## Parameters

See [`readContract` Parameters](/core/api/actions/readContract#parameters).

### query

See [TanStack Solid Query docs](https://tanstack.com/query/v5/docs/framework/solid/reference/createQuery) for query options.

## Action

- [`readContract`](/core/api/actions/readContract)
