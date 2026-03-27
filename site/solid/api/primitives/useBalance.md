# useBalance

Primitive for fetching the AE balance of an address.

## Import

```typescript
import { useBalance } from '@growae/reactive-solid'
```

## Usage

```tsx
import { useBalance } from '@growae/reactive-solid'
import { Show } from 'solid-js'

function Balance() {
  const balance = useBalance({
    address: 'ak_2dATGVvfU1oBShDDsaqfh1sF4bCkx2FKbiCaL2t4zZpMMpMfgE',
  })

  return (
    <Show when={!balance.isLoading} fallback={<div>Loading...</div>}>
      <div>{balance.data?.ae} AE</div>
    </Show>
  )
}
```

## Return Type

See [TanStack Solid Query docs](https://tanstack.com/query/v5/docs/framework/solid/reference/createQuery) for full return type.

### data

See [`getBalance` Return Type](/core/api/actions/getBalance#return-type).

## Parameters

### address

- **Type:** `string | Accessor<string>`
- **Required**

The account address. Accepts Solid accessors.

### query

See [TanStack Solid Query docs](https://tanstack.com/query/v5/docs/framework/solid/reference/createQuery) for query options.

## Action

- [`getBalance`](/core/api/actions/getBalance)
