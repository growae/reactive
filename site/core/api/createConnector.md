# createConnector

Creates a custom wallet connector for Reactive. Connectors handle the communication between your app and an Aeternity wallet.

## Import

```typescript
import { createConnector } from '@growae/reactive'
```

## Usage

```typescript
import { createConnector } from '@growae/reactive'

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

Signing is optional — a connector that omits these methods is a read-only one:

| Method | Return Type | Description |
|--------|------------|-------------|
| `signTransaction` | `string` | Sign `{ tx, networkId, innerTx?, onAccount? }` |
| `signMessage` | `string` | Sign `{ message, onAccount? }` |

### Signing for a named account

`signTransaction` and `signMessage` each take an optional `onAccount`: the
address the caller meant to sign with. It is optional on both so that a
connector written before the parameter existed keeps working, but an
implementation that receives it has one obligation:

**Sign with exactly that account, or throw `ConnectorAccountUnavailableError`.
Never fall back to another account.** A transaction built for one account and
signed by another is either rejected by the node with a bare signature error
or — when the connector holds both keys — accepted, moving the wrong account's
funds with nothing anywhere reporting a problem. A message signed by an account
the caller did not name moves nothing, but it is a valid signature that
verifies against the wrong address: the caller's check fails downstream with
nothing pointing back at the connector that mis-signed it.

The rule is the same on both methods, and a connector that enforces it on one
and not the other is the shape this obligation exists to prevent. A connector
that cannot serve the named account — one bound to a single derivation path or
device index, as `ledger` and `metamaskSnap` are — throws for any other account
rather than signing from the one it has.

Core passes the account it built for, which is `activeAccount` on the
connection, on both paths. Without the pin, a `switchActiveAccount` to a second
account leaves the transaction built for the new one and signed by whichever
the connector picked for itself, and the message signed by that same
self-chosen account while the caller verifies against the active one.

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
