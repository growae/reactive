# useSwitchActiveAccount

Primitive for switching the active account to a different one from the connected wallet.

## Import

```typescript
import { useSwitchActiveAccount } from '@growae/reactive-solid'
```

## Usage

```tsx
import { useActiveAccount, useSwitchActiveAccount } from '@growae/reactive-solid'
import { For, Show } from 'solid-js'

function AccountSwitcher() {
  const activeAccount = useActiveAccount()
  const { switchActiveAccount, isPending, error } = useSwitchActiveAccount()

  return (
    <Show when={activeAccount().isConnected}>
      <For each={activeAccount().addresses}>
        {(addr) => (
          <button
            disabled={addr === activeAccount().address || isPending()}
            onClick={() => switchActiveAccount({ account: addr })}
          >
            {addr.slice(0, 10)}...
          </button>
        )}
      </For>
      <Show when={error()}>
        <p>{error()?.message}</p>
      </Show>
    </Show>
  )
}
```

## Return Type

```typescript
type UseSwitchActiveAccountReturnType = {
  switchActiveAccount: (params: { account: string }) => void
  isPending: Accessor<boolean>
  error: Accessor<Error | null>
}
```

### switchActiveAccount

Switches the active account. Throws `AccountNotFoundError` if the address is not in the wallet's account list.

### isPending

Reactive accessor — `true` while the switch is in progress.

### error

Reactive accessor — the last error that occurred, or `null`.

## Parameters

### parameters

- **Type:** `Accessor<{ config?: Config }>`
- **Optional**

Pass a reactive accessor if you need to provide a custom [`Config`](/core/api/createConfig).

## Actions

- [`switchActiveAccount`](/core/api/actions/switchActiveAccount)

## Related

- [`useActiveAccount`](/solid/api/primitives/useActiveAccount)
