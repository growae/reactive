# useSwitchConnection

Select an already-connected wallet as the current connection. Use this when an app has connected more than one wallet and the user chooses which one to use. For two accounts in the same wallet, use [`useSwitchActiveAccount`](./useSwitchActiveAccount).

```tsx
import { useSwitchConnection } from '@growae/reactive-react'

function WalletPicker() {
  const { connections, switchConnection, isPending, error } = useSwitchConnection()

  return (
    <>
      {[...connections.values()].map(({ connector }) => (
        <button key={connector.uid} disabled={isPending}
          onClick={() => switchConnection({ connector })}>
          {connector.name}
        </button>
      ))}
      {error && <p>{error.message}</p>}
    </>
  )
}
```

The optional `config` parameter selects a configuration in place of the provider’s. `connections` is the current map of open connections, keyed by connector UID. `switchConnection({ connector })` starts the mutation. `await switchConnectionAsync({ connector })` resolves to `void` or rejects with `ConnectorNotFoundError` if that wallet has disconnected. TanStack Query exposes the pending, success, and error states.
