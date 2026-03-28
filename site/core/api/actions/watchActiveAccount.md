# watchActiveAccount

Subscribes to changes in the active account. Fires when the active account switches (via `switchActiveAccount`) or when the wallet pushes a new account list and the current active account is no longer present.

## Import

```typescript
import { watchActiveAccount } from '@growae/reactive'
```

## Usage

```typescript
import { watchActiveAccount } from '@growae/reactive'

const unwatch = watchActiveAccount(config, {
  onChange(activeAccount, prevActiveAccount) {
    if (activeAccount.isConnected) {
      console.log('New active account:', activeAccount.address)
    }
  },
})

// Stop watching
unwatch()
```

## Parameters

### onChange

- **Type:** `(activeAccount: GetActiveAccountReturnType, prevActiveAccount: GetActiveAccountReturnType) => void`
- **Required**

Callback that fires whenever the active account changes. Both current and previous values are passed, allowing comparison.

## Return Type

`() => void` — call to stop the subscription.

## Examples

### React to wallet-pushed account changes

```typescript
// When Superhero Wallet switches the selected account, this fires automatically
const unwatch = watchActiveAccount(config, {
  onChange({ address, isConnected }) {
    if (isConnected) {
      refetchUserData(address)
    }
  },
})
```

### Build your own reactive primitive

```typescript
let currentAccount = getActiveAccount(config)

const unwatch = watchActiveAccount(config, {
  onChange(next) {
    currentAccount = next
    renderUI()
  },
})
```

## Related

- [`getActiveAccount`](/core/api/actions/getActiveAccount)
- [`switchActiveAccount`](/core/api/actions/switchActiveAccount)
