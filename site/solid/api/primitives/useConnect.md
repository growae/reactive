# useConnect

Primitive for connecting to a wallet.

## Import

```typescript
import { useConnect } from '@growae/reactive-solid'
```

## Usage

```tsx
import { useConnect } from '@growae/reactive-solid'
import { For } from 'solid-js'

function ConnectButton() {
  const { connect, connectors, isPending } = useConnect()

  return (
    <For each={connectors()}>
      {(connector) => (
        <button
          onClick={() => connect({ connector })}
          disabled={isPending()}
        >
          {connector.name}
        </button>
      )}
    </For>
  )
}
```

## Return Type

All return values are Solid accessors (signals):

```typescript
type UseConnectReturnType = {
  connect: (params: { connector: Connector }) => void
  connectAsync: (params: { connector: Connector }) => Promise<ConnectReturnType>
  connectors: Accessor<readonly Connector[]>
  data: Accessor<ConnectReturnType | undefined>
  error: Accessor<ConnectErrorType | null>
  isPending: Accessor<boolean>
  isSuccess: Accessor<boolean>
  isError: Accessor<boolean>
  reset: () => void
}
```

## Action

- [`connect`](/core/api/actions/connect)
