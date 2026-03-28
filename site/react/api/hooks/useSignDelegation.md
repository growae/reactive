# useSignDelegation

Hook for signing delegation transactions.

## Import

```typescript
import { useSignDelegation } from '@growae/reactive-react'
```

## Usage

```tsx
import { useSignDelegation } from '@growae/reactive-react'

function DelegateAction() {
  const { mutate: signDelegation, isPending, data } = useSignDelegation()

  return (
    <div>
      <button
        onClick={() => signDelegation({ delegation: packed })}
        disabled={isPending}
      >
        Sign Delegation
      </button>
      {data && <p>Signature: {data}</p>}
    </div>
  )
}
```

## Return Type

See [TanStack Query mutation docs](https://tanstack.com/query/v5/docs/framework/react/reference/useMutation) for full return type.

### data

See [`signDelegation` Return Type](/core/api/actions/signDelegation#return-type).

## Parameters

See [`signDelegation` Parameters](/core/api/actions/signDelegation#parameters) for all available options.

Key parameters:

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `delegation` | `any` | — | Required. The packed delegation to sign. |
| `networkId` | `string` | — | Optional. Target network. |
| `account` | `string` | — | Optional. Account address to sign with. |
| `connector` | `Connector` | — | Optional. Connector to use for signing. |

### mutation

See [TanStack Query mutation docs](https://tanstack.com/query/v5/docs/framework/react/reference/useMutation) for mutation options.

## Action

- [`signDelegation`](/core/api/actions/signDelegation)
