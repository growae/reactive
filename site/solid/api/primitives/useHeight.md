# useHeight

Primitive for fetching the current block height.

## Import

```typescript
import { useHeight } from '@reactive/solid'
```

## Usage

```tsx
import { useHeight } from '@reactive/solid'
import { Show } from 'solid-js'

function BlockHeight() {
  const height = useHeight()

  return (
    <Show when={!height.isLoading} fallback={<div>Loading...</div>}>
      <div>Current height: {height.data}</div>
    </Show>
  )
}
```

## Return Type

### data

- **Type:** `Accessor<number | undefined>`

The current key block height.

## Parameters

### networkId

- **Type:** `string | Accessor<string>`
- **Optional**

Target network.

### query

See [TanStack Solid Query docs](https://tanstack.com/query/v5/docs/framework/solid/reference/createQuery) for query options.
