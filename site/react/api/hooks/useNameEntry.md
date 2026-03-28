# useNameEntry

Hook for looking up an AENS name entry.

## Import

```typescript
import { useNameEntry } from '@growae/reactive-react'
```

## Usage

```tsx
import { useNameEntry } from '@growae/reactive-react'

function NameLookup() {
  const { data: entry, isLoading } = useNameEntry({ name: 'myname.chain' })

  if (isLoading) return <div>Looking up name...</div>
  return (
    <div>
      <p>Owner: {entry?.owner}</p>
      <p>TTL: {entry?.ttl}</p>
    </div>
  )
}
```

## Return Type

See [TanStack Query query docs](https://tanstack.com/query/v5/docs/framework/react/reference/useQuery) for full return type.

### data

See [`getNameEntry` Return Type](/core/api/actions/getNameEntry#return-type).

## Parameters

### name

- **Type:** `string`
- **Required**

The AENS name to look up (e.g. `'myname.chain'`).

### networkId

- **Type:** `string`
- **Optional**

Target network.

### query

See [TanStack Query query docs](https://tanstack.com/query/v5/docs/framework/react/reference/useQuery) for query options.

## Action

- [`getNameEntry`](/core/api/actions/getNameEntry)
