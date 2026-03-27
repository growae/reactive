# useDeployContract

Hook for deploying a Sophia smart contract.

## Import

```typescript
import { useDeployContract } from '@reactive/react'
```

## Usage

```tsx
import { useDeployContract } from '@reactive/react'

function Deploy() {
  const { mutate: deploy, data, isPending } = useDeployContract()

  return (
    <div>
      <button
        onClick={() =>
          deploy({
            aci: contractAci,
            bytecode: compiledBytecode,
            args: ['initial_value'],
          })
        }
        disabled={isPending}
      >
        Deploy Contract
      </button>
      {data && <p>Deployed at: {data.address}</p>}
    </div>
  )
}
```

## Return Type

See [TanStack Query mutation docs](https://tanstack.com/query/v5/docs/framework/react/reference/useMutation) for full return type.

### data

See [`deployContract` Return Type](/core/api/actions/deployContract#return-type).

## Parameters

See [`deployContract` Parameters](/core/api/actions/deployContract#parameters) for all options.

Key parameters include `ttl` which defaults to `300` blocks.

::: tip Default TTL
All transactions default to a TTL of 300 blocks (~15 hours). This prevents stale transactions from lingering indefinitely. Override with `ttl: 0` for no expiration.
:::

### mutation

See [TanStack Query mutation docs](https://tanstack.com/query/v5/docs/framework/react/reference/useMutation) for mutation options.

## Action

- [`deployContract`](/core/api/actions/deployContract)
