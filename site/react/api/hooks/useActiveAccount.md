# useActiveAccount

Hook for reading the currently active wallet account. Returns address, all available addresses, and connection state — reactively updated whenever the active account changes.

## Import

```typescript
import { useActiveAccount } from '@growae/reactive-react'
```

## Usage

```tsx
import { useActiveAccount } from '@growae/reactive-react'

function Account() {
  const { address, addresses, isConnected, connector } = useActiveAccount()

  if (!isConnected) return <p>Not connected</p>

  return (
    <div>
      <p>Active: {address}</p>
      <p>All accounts: {addresses.length}</p>
    </div>
  )
}
```

## Return Type

```typescript
type UseActiveAccountReturnType =
  | {
      address: string
      addresses: readonly [string, ...string[]]
      connector: Connector
      isConnected: true
    }
  | {
      address: undefined
      addresses: undefined
      connector: undefined
      isConnected: false
    }
```

### address

The active account address (`ak_...`). `undefined` when disconnected.

### addresses

All accounts from the connected wallet. `undefined` when disconnected.

### connector

The current `Connector` instance. `undefined` when disconnected.

### isConnected

`true` when a wallet is connected, `false` otherwise. Narrows the type of `address`, `addresses`, and `connector`.

## Parameters

### config

- **Type:** `Config`
- **Optional**

[`Config`](/core/api/createConfig) to use instead of the one from context.

## Examples

### Show all wallet accounts

```tsx
import { useActiveAccount, useSwitchActiveAccount } from '@growae/reactive-react'

function AccountList() {
  const { address, addresses, isConnected } = useActiveAccount()
  const { switchActiveAccount } = useSwitchActiveAccount()

  if (!isConnected) return null

  return (
    <ul>
      {addresses.map((addr) => (
        <li key={addr}>
          {addr.slice(0, 12)}...
          {addr === address && ' (active)'}
          {addr !== address && (
            <button onClick={() => switchActiveAccount({ account: addr })}>
              Switch
            </button>
          )}
        </li>
      ))}
    </ul>
  )
}
```

## Actions

- [`getActiveAccount`](/core/api/actions/getActiveAccount)
- [`watchActiveAccount`](/core/api/actions/watchActiveAccount)

## Related

- [`useSwitchActiveAccount`](/react/api/hooks/useSwitchActiveAccount)
