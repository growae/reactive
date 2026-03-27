# createConnector

Creates a custom wallet connector for Reactive. Connectors handle the communication between your app and an Aeternity wallet.

## Import

```typescript
import { createConnector } from '@reactive/core'
```

## Usage

```typescript
import { createConnector } from '@reactive/core'

const myWallet = createConnector((config) => ({
  id: 'myWallet',
  name: 'My Wallet',
  type: 'injected',

  async connect() {
    // Establish connection to wallet
    const accounts = await this.getAccounts()
    return { accounts, networkId: 'ae_mainnet' }
  },

  async disconnect() {
    // Clean up wallet connection
  },

  async getAccounts() {
    // Return connected account addresses
    return ['ak_...']
  },

  async getProvider() {
    // Return the wallet provider/signer
  },

  async isAuthorized() {
    // Check if previously authorized
    return false
  },

  onAccountsChanged(accounts) {
    // Handle account switches
  },

  onNetworkChanged(networkId) {
    // Handle network switches
  },

  onDisconnect() {
    // Handle wallet disconnect
  },
}))
```

## Connector Interface

Every connector must implement:

| Method | Return Type | Description |
|--------|------------|-------------|
| `connect` | `{ accounts, networkId }` | Connect to the wallet |
| `disconnect` | `void` | Disconnect from the wallet |
| `getAccounts` | `string[]` | Get connected accounts |
| `getProvider` | `AccountBase` | Get signing provider |
| `isAuthorized` | `boolean` | Check previous authorization |

## Events

Connectors emit events via the `config.emitter`:

| Event | Payload | Description |
|-------|---------|-------------|
| `connect` | `{ accounts, networkId }` | Wallet connected |
| `disconnect` | — | Wallet disconnected |
| `change` | `{ accounts?, networkId? }` | Account or network changed |
| `error` | `Error` | Connector error |

## Built-in Connectors

| Connector | Description |
|-----------|-------------|
| `superhero()` | Superhero Wallet (browser extension + deeplink) |
| `iframe()` | Iframe-based wallet communication |
| `mock()` | Testing connector with configurable accounts |
