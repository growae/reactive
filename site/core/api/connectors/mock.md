# mock

Configurable mock connector for unit tests. Simulates wallet behaviour with controllable errors and connection state.

## Import

```typescript
import { mock } from '@growae/reactive'
```

## Usage

```typescript
import { createConfig, mock } from '@growae/reactive'
import { testnet } from '@growae/reactive/networks'

const config = createConfig({
  networks: [testnet],
  connectors: [
    mock({
      accounts: ['ak_2dATMhSHswAYLiyDBCGmMRBdWKpsfpygSrL3t6Ees3P6FnBzBJ'],
    }),
  ],
})
```

## Parameters

### accounts

- **Type:** `readonly [string, ...string[]]`
- **Required**

Array of account addresses the mock connector returns on connect.

### features

- **Type:** `object`
- **Optional**

Control mock behaviour for testing error paths and edge cases.

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `defaultConnected` | `boolean` | `false` | Start in connected state |
| `connectError` | `boolean \| Error` | — | Throw on `connect()` |
| `switchNetworkError` | `boolean \| Error` | — | Throw on `switchNetwork()` |
| `signMessageError` | `boolean \| Error` | — | Throw on `signMessage()` |
| `signTransactionError` | `boolean \| Error` | — | Throw on `signTransaction()` |
| `reconnect` | `boolean` | `false` | Allow `isAuthorized()` to return `true` |

```typescript
mock({
  accounts: ['ak_...'],
  features: {
    connectError: new Error('User rejected'),
    defaultConnected: false,
  },
})
```

## Connector Details

- **Type:** `'mock'`
- **ID:** `'mock'`
- **Name:** `'Mock Connector'`
- **Package:** `@growae/reactive` (built-in)

::: warning
The mock connector is for testing only. Transaction signing returns dummy values (`signed_<tx>`), not real cryptographic signatures.
:::
