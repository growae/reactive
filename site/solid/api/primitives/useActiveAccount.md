# useActiveAccount

Primitive for reading the currently active wallet account. Returns a reactive `Accessor` updated whenever the active account changes.

## Import

```typescript
import { useActiveAccount } from '@growae/reactive-solid'
```

## Usage

```tsx
import { useActiveAccount } from '@growae/reactive-solid'
import { Show } from 'solid-js'

function Account() {
  const activeAccount = useActiveAccount()

  return (
    <Show when={activeAccount().isConnected} fallback={<p>Not connected</p>}>
      <p>Active: {activeAccount().address}</p>
      <p>All accounts: {activeAccount().addresses?.length}</p>
    </Show>
  )
}
```

## Return Type

```typescript
type UseActiveAccountReturnType = Accessor<
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
>
```

Call the accessor to get the current value:

```typescript
const activeAccount = useActiveAccount()
activeAccount().address    // string | undefined
activeAccount().isConnected // boolean
```

## Parameters

### parameters

- **Type:** `Accessor<{ config?: Config }>`
- **Optional**

Pass a reactive accessor if you need to provide a custom [`Config`](/core/api/createConfig).

## Examples

### Account switcher

```tsx
import { useActiveAccount, useSwitchActiveAccount } from '@growae/reactive-solid'
import { For, Show } from 'solid-js'

function AccountSwitcher() {
  const activeAccount = useActiveAccount()
  const { switchActiveAccount } = useSwitchActiveAccount()

  return (
    <Show when={activeAccount().isConnected}>
      <For each={activeAccount().addresses}>
        {(addr) => (
          <button
            disabled={addr === activeAccount().address}
            onClick={() => switchActiveAccount({ account: addr })}
          >
            {addr.slice(0, 10)}...
            {addr === activeAccount().address ? ' (active)' : ''}
          </button>
        )}
      </For>
    </Show>
  )
}
```

## Actions

- [`getActiveAccount`](/core/api/actions/getActiveAccount)
- [`watchActiveAccount`](/core/api/actions/watchActiveAccount)

## Related

- [`useSwitchActiveAccount`](/solid/api/primitives/useSwitchActiveAccount)
