# useDisconnect

Primitive for disconnecting the current wallet.

## Import

```typescript
import { useDisconnect } from '@reactive/solid'
```

## Usage

```tsx
import { useDisconnect } from '@reactive/solid'

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
  isPending: Accessor<boolean>
  isSuccess: Accessor<boolean>
  isError: Accessor<boolean>
}
```
