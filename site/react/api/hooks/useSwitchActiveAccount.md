# useSwitchActiveAccount

Hook for switching the active account to a different one from the connected wallet.

## Import

```typescript
import { useSwitchActiveAccount } from '@growae/reactive-react'
```

## Usage

```tsx
import { useActiveAccount, useSwitchActiveAccount } from '@growae/reactive-react'

function AccountSwitcher() {
  const { address, addresses, isConnected } = useActiveAccount()
  const { switchActiveAccount, isPending, error } = useSwitchActiveAccount()

  if (!isConnected) return null

  return (
    <div>
      <p>Active: {address}</p>
      {addresses.map((addr) => (
        <button
          key={addr}
          disabled={addr === address || isPending}
          onClick={() => switchActiveAccount({ account: addr })}
        >
          {addr.slice(0, 10)}...
        </button>
      ))}
      {error && <p>Error: {error.message}</p>}
    </div>
  )
}
```

## Return Type

```typescript
type UseSwitchActiveAccountReturnType = {
  switchActiveAccount: (params: { account: string }) => void
  isPending: boolean
  error: Error | null
}
```

### switchActiveAccount

Call with `{ account: 'ak_...' }` to switch the active account. Throws `AccountNotFoundError` if the address is not in the wallet's account list.

### isPending

`true` while the switch is in progress.

### error

The last error that occurred, or `null`.

## Parameters

### config

- **Type:** `Config`
- **Optional**

[`Config`](/core/api/createConfig) to use instead of the one from context.

## Actions

- [`switchActiveAccount`](/core/api/actions/switchActiveAccount)

## Related

- [`useActiveAccount`](/react/api/hooks/useActiveAccount)
