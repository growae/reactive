# usePreclaimName

Hook for preclaiming an AENS name (commit step of commit-reveal scheme).

## Import

```typescript
import { usePreclaimName } from '@growae/reactive-react'
```

## Usage

```tsx
import { usePreclaimName } from '@growae/reactive-react'

function PreclaimName() {
  const { mutate: preclaim, data, isPending } = usePreclaimName()

  return (
    <div>
      <button
        onClick={() => preclaim({ name: 'myname.chain' })}
        disabled={isPending}
      >
        Preclaim Name
      </button>
      {data && <p>Salt: {data.salt} (save this for claiming)</p>}
    </div>
  )
}
```

## Return Type

See [TanStack Query mutation docs](https://tanstack.com/query/v5/docs/framework/react/reference/useMutation) for full return type.

### data

```typescript
type PreclaimNameReturnType = {
  hash: string
  salt: number
}
```

## Parameters

### name

- **Type:** `string`
- **Required**

The AENS name to preclaim.

### ttl

- **Type:** `number`
- **Default:** `300`

Transaction TTL in blocks relative to current height. Set to `0` for no expiration.

::: tip Default TTL
All transactions default to a TTL of 300 blocks (~15 hours). This prevents stale transactions from lingering indefinitely. Override with `ttl: 0` for no expiration.
:::

### mutation

See [TanStack Query mutation docs](https://tanstack.com/query/v5/docs/framework/react/reference/useMutation) for mutation options.
