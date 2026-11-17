# useSignDelegation

Primitive for signing delegation transactions.

## Import

```typescript
import { useSignDelegation } from '@growae/reactive-solid'
```

## Usage

```tsx
import { useSignDelegation } from '@growae/reactive-solid'

function DelegateAction() {
  const signDelegation = useSignDelegation()

  return (
    <div>
      <button
        onClick={() => signDelegation.mutate({ delegation: packed })}
        disabled={signDelegation.isPending}
      >
        Sign Delegation
      </button>
      <Show when={signDelegation.data}>
        <p>Signature: {signDelegation.data}</p>
      </Show>
    </div>
  )
}
```

## Parameters

See [`signDelegation` Parameters](/core/api/actions/signDelegation#parameters).

Key parameters:

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `delegation` | `any` | — | Required. The packed delegation to sign. |
| `networkId` | `string` | — | Optional. Target network. |
| `account` | `string` | — | Optional. Account address to sign with. |
| `connector` | `Connector` | — | Optional. Connector to use for signing. |

## Action

- [`signDelegation`](/core/api/actions/signDelegation)
