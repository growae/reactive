# useResolveName

Hook for resolving an AENS name to an address.

## Import

```typescript
import { useResolveName } from '@growae/reactive-react'
```

## Usage

```tsx
import { useResolveName } from '@growae/reactive-react'

function ResolveName() {
  const { data: address, isLoading } = useResolveName({
    name: 'alice.chain',
    key: 'account_pubkey',
  })

  if (isLoading) return <div>Resolving...</div>
  return <div>Address: {address}</div>
}
```

## Return Type

See [TanStack Query query docs](https://tanstack.com/query/v5/docs/framework/react/reference/useQuery) for full return type.

### data

- **Type:** `string | null`

The resolved address, or `null` if the name is not registered or has no pointer for the given key.

## Parameters

### name

- **Type:** `string`
- **Required**

The AENS name to resolve (e.g. `alice.chain`).

### key

- **Type:** `string`
- **Default:** `'account_pubkey'`

The pointer key to resolve.

### query

See [TanStack Query query docs](https://tanstack.com/query/v5/docs/framework/react/reference/useQuery) for query options.
