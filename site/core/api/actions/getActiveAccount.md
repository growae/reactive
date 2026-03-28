# getActiveAccount

Returns the currently active account from the connected wallet, or an `isConnected: false` object when no wallet is connected.

## Import

```typescript
import { getActiveAccount } from '@growae/reactive'
```

## Usage

```typescript
import { getActiveAccount } from '@growae/reactive'

const result = getActiveAccount(config)

if (result.isConnected) {
  console.log(result.address)    // 'ak_2dATGVv...'
  console.log(result.addresses)  // readonly ['ak_2dATGVv...', ...]
  console.log(result.connector)  // Connector
}
```

## Return Type

```typescript
type GetActiveAccountReturnType =
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

All accounts provided by the connected wallet. `undefined` when disconnected.

### connector

The current `Connector` instance. `undefined` when disconnected.

### isConnected

`true` when a wallet is connected, `false` otherwise. Use this to narrow the return type.

## Difference from `getConnection`

| | `getActiveAccount` | `getConnection` |
|---|---|---|
| Returns | Active signing account | Raw connection metadata (uid, networkId) |
| Use case | Get address for signing / display | Check connection status |

## Related

- [`switchActiveAccount`](/core/api/actions/switchActiveAccount)
- [`watchActiveAccount`](/core/api/actions/watchActiveAccount)
