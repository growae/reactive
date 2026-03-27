# useCallContract

Hook for calling a Sophia contract function as an on-chain transaction.

## Import

```typescript
import { useCallContract } from '@reactive/react'
```

## Usage

```tsx
import { useCallContract } from '@reactive/react'

function TransferTokens() {
  const { mutate: call, isPending, isSuccess } = useCallContract()

  return (
    <button
      onClick={() =>
        call({
          address: 'ct_token...',
          aci: tokenAci,
          fn: 'transfer',
          args: ['ak_recipient...', 1000n],
        })
      }
      disabled={isPending}
    >
      Transfer Tokens
    </button>
  )
}
```

## Return Type

See [TanStack Query mutation docs](https://tanstack.com/query/v5/docs/framework/react/reference/useMutation) for full return type.

### data

See [`callContract` Return Type](/core/api/actions/callContract#return-type).

## Parameters

See [`callContract` Parameters](/core/api/actions/callContract#parameters) for all options.

Key parameters include `ttl` which defaults to `300` blocks.

::: tip Default TTL
All transactions default to a TTL of 300 blocks (~15 hours). This prevents stale transactions from lingering indefinitely. Override with `ttl: 0` for no expiration.
:::

### mutation

See [TanStack Query mutation docs](https://tanstack.com/query/v5/docs/framework/react/reference/useMutation) for mutation options.

## Action

- [`callContract`](/core/api/actions/callContract)
