# useSignMessage

Hook for signing an arbitrary message with the connected account.

## Import

```typescript
import { useSignMessage } from '@reactive/react'
```

## Usage

```tsx
import { useSignMessage } from '@reactive/react'

function SignMessage() {
  const { mutate: sign, data, isPending } = useSignMessage()

  return (
    <div>
      <button onClick={() => sign({ message: 'Hello, Aeternity!' })}>
        Sign Message
      </button>
      {data && <p>Signature: {data.signature}</p>}
    </div>
  )
}
```

## Return Type

See [TanStack Query mutation docs](https://tanstack.com/query/v5/docs/framework/react/reference/useMutation) for full return type.

### data

See [`signMessage` Return Type](/core/api/actions/signMessage#return-type).

## Parameters

See [`signMessage` Parameters](/core/api/actions/signMessage#parameters).

### mutation

See [TanStack Query mutation docs](https://tanstack.com/query/v5/docs/framework/react/reference/useMutation) for mutation options.

## Action

- [`signMessage`](/core/api/actions/signMessage)
