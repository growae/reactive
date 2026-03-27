# useConnect

Hook for connecting to a wallet.

## Import

```typescript
import { useConnect } from '@reactive/react'
```

## Usage

```tsx
import { useConnect } from '@reactive/react'

function ConnectButton() {
  const { connect, connectors, isPending } = useConnect()

  return (
    <div>
      {connectors.map((connector) => (
        <button
          key={connector.id}
          onClick={() => connect({ connector })}
          disabled={isPending}
        >
          {connector.name}
        </button>
      ))}
    </div>
  )
}
```

## Return Type

```typescript
type UseConnectReturnType = {
  connect: (params: { connector: Connector }) => void
  connectAsync: (params: { connector: Connector }) => Promise<ConnectReturnType>
  connectors: readonly Connector[]
  data: ConnectReturnType | undefined
  error: ConnectErrorType | null
  isPending: boolean
  isSuccess: boolean
  isError: boolean
  reset: () => void
}
```

## Parameters

### mutation

See [TanStack Query mutation docs](https://tanstack.com/query/v5/docs/framework/react/reference/useMutation) for mutation options.

## Action

- [`connect`](/core/api/actions/connect)
