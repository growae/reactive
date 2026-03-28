# useNameEntry

Primitive for looking up an AENS name entry.

## Import

```typescript
import { useNameEntry } from '@growae/reactive-solid'
```

## Usage

```tsx
import { useNameEntry } from '@growae/reactive-solid'
import { Show } from 'solid-js'

function NameLookup() {
  const entry = useNameEntry({ name: 'myname.chain' })

  return (
    <Show when={!entry.isLoading} fallback={<div>Looking up name...</div>}>
      <div>
        <p>Owner: {entry.data?.owner}</p>
        <p>TTL: {entry.data?.ttl}</p>
      </div>
    </Show>
  )
}
```

## Return Type

### data

- **Type:** `Accessor<{ id, owner, pointers, ttl } | undefined>`

The AENS name entry data.

## Parameters

### name

- **Type:** `string | Accessor<string>`
- **Required**

The AENS name to look up (e.g. `'myname.chain'`).

### networkId

- **Type:** `string | Accessor<string>`
- **Optional**

Target network.

### query

See [TanStack Solid Query docs](https://tanstack.com/query/v5/docs/framework/solid/reference/createQuery) for query options.

## Action

- [`getNameEntry`](/core/api/actions/getNameEntry)
