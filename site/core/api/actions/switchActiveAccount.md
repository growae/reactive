# switchActiveAccount

Switches the active account to a different account from the connected wallet's account list.

## Import

```typescript
import { switchActiveAccount } from '@growae/reactive'
```

## Usage

```typescript
import { getActiveAccount, switchActiveAccount } from '@growae/reactive'

// Get all available accounts
const { addresses } = getActiveAccount(config)

// Switch to the second account
if (addresses && addresses[1]) {
  switchActiveAccount(config, { account: addresses[1] })
}
```

## Parameters

### account

- **Type:** `string`
- **Required**

The address to switch to. Must be one of the addresses currently in `connection.accounts`. Throws `AccountNotFoundError` if the address is not in the connected wallet's account list.

## Return Type

`void` — this action updates state synchronously.

## Errors

```typescript
import type { AccountNotFoundErrorType } from '@growae/reactive'
```

- `AccountNotFoundError` — thrown when no wallet is connected, or when the given `account` is not in the current wallet's account list.

## Example

### Switch between accounts

```typescript
import {
  getActiveAccount,
  switchActiveAccount,
  watchActiveAccount,
} from '@growae/reactive'

// Log the active account whenever it changes
watchActiveAccount(config, {
  onChange({ address }) {
    console.log('Active account:', address)
  },
})

// Switch account
switchActiveAccount(config, { account: 'ak_abc...' })
```

## Related

- [`getActiveAccount`](/core/api/actions/getActiveAccount)
- [`watchActiveAccount`](/core/api/actions/watchActiveAccount)
