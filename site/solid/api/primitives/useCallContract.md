# useCallContract

Primitive for calling a Sophia contract function as an on-chain transaction.

## Import

```typescript
import { useCallContract } from '@reactive/solid'
```

## Usage

```tsx
import { useCallContract } from '@reactive/solid'

function TransferTokens() {
  const callContract = useCallContract()

  return (
    <button
      onClick={() =>
        callContract.mutate({
          address: 'ct_token...',
          aci: tokenAci,
          fn: 'transfer',
          args: ['ak_recipient...', 1000n],
        })
      }
      disabled={callContract.isPending}
    >
      Transfer Tokens
    </button>
  )
}
```

## Parameters

See [`callContract` Parameters](/core/api/actions/callContract#parameters).

Key parameters include `ttl` which defaults to `300` blocks.

::: tip Default TTL
All transactions default to a TTL of 300 blocks (~15 hours). This prevents stale transactions from lingering indefinitely. Override with `ttl: 0` for no expiration.
:::

## Action

- [`callContract`](/core/api/actions/callContract)
