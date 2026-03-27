# useClaimName

Hook for claiming a preclaimed AENS name (reveal step of commit-reveal scheme).

## Import

```typescript
import { useClaimName } from '@growae/reactive-react'
```

## Usage

```tsx
import { useClaimName } from '@growae/reactive-react'

function ClaimName() {
  const { mutate: claim, isPending, isSuccess } = useClaimName()

  return (
    <button
      onClick={() =>
        claim({
          name: 'myname.chain',
          salt: 12345678, // from preclaim step
        })
      }
      disabled={isPending}
    >
      Claim Name
    </button>
  )
}
```

## Return Type

See [TanStack Query mutation docs](https://tanstack.com/query/v5/docs/framework/react/reference/useMutation) for full return type.

### data

```typescript
type ClaimNameReturnType = {
  hash: string
  name: string
}
```

## Parameters

### name

- **Type:** `string`
- **Required**

The AENS name to claim.

### salt

- **Type:** `number`
- **Required**

The salt from the preclaim step.

### nameFee

- **Type:** `bigint`
- **Optional**

Custom name fee (for auctions).

### ttl

- **Type:** `number`
- **Default:** `300`

Transaction TTL in blocks relative to current height. Set to `0` for no expiration.

::: tip Default TTL
All transactions default to a TTL of 300 blocks (~15 hours). This prevents stale transactions from lingering indefinitely. Override with `ttl: 0` for no expiration.
:::

### mutation

See [TanStack Query mutation docs](https://tanstack.com/query/v5/docs/framework/react/reference/useMutation) for mutation options.
