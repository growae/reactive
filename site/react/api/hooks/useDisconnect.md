# useDisconnect

Hook for disconnecting the current wallet.

## Import

```typescript
import { useDisconnect } from '@reactive/react'
```

## Usage

```tsx
import { useDisconnect } from '@reactive/react'

function DisconnectButton() {
  const { disconnect } = useDisconnect()

  return <button onClick={() => disconnect()}>Disconnect</button>
}
```

## Return Type

```typescript
type UseDisconnectReturnType = {
  disconnect: () => void
  disconnectAsync: () => Promise<void>
  isPending: boolean
  isSuccess: boolean
  isError: boolean
  error: Error | null
}
```

## Parameters

### mutation

See [TanStack Query mutation docs](https://tanstack.com/query/v5/docs/framework/react/reference/useMutation) for mutation options.
