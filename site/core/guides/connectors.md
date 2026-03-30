# Connectors

Connectors are the bridge between your dApp and an Aeternity wallet. Each connector implements how Reactive discovers accounts, signs transactions, and talks to a specific wallet environment (browser extension, iframe parent, hardware device, MetaMask Snap, or an in-memory key for development).

Reactive registers connectors on your [`createConfig`](/core/api/createConfig) instance. The [`connect`](/core/api/actions/connect) action (and framework hooks like `useConnect`) use that list so users can pick a wallet and establish a session.

::: info Import paths

Wallet connectors from the connectors package can be imported from either **`@growae/reactive-connectors`** or **`@growae/reactive/connectors`** (convenience re-export from core).

Built-in **`memory()`** and **`mock()`** are exported from **`@growae/reactive`** only.

:::

## Install the connectors package

Add **`@growae/reactive`** if you have not already, then add **`@growae/reactive-connectors`** when you need browser, iframe, Ledger, or MetaMask Snap connectors.

::: code-group

```bash [pnpm]
pnpm add @growae/reactive @growae/reactive-connectors
```

```bash [npm]
npm install @growae/reactive @growae/reactive-connectors
```

```bash [yarn]
yarn add @growae/reactive @growae/reactive-connectors
```

:::

::: tip Built-in connectors only

If you only use [`memory()`](#built-in-connectors-from-growaereactive) or [`mock()`](#built-in-connectors-from-growaereactive) for development or tests, you do not need to install `@growae/reactive-connectors`.

:::

::: warning Ledger and MetaMask Snap

- **Ledger** — install **`@ledgerhq/hw-transport`** (and a concrete transport such as WebUSB or Node HID) alongside the connectors package; the Ledger connector expects that peer at runtime.
- **MetaMask Snap** — relies on the MetaMask Snaps API and the **`@aeternity-snap/plugin`** snap for Aeternity account management.

:::

## Available connectors

### From `@growae/reactive-connectors` (or `@growae/reactive/connectors`)

| Connector | Type | Description |
| --------- | ---- | ----------- |
| [`superhero()`](/core/api/connectors/superhero) | Browser extension | Connects to the Superhero Wallet browser extension. Most common for web dApps. Uses WalletConnectorFrame RPC. |
| [`iframe()`](/core/api/connectors/iframe) | Iframe | For dApps embedded inside an iframe that communicate with a wallet in the parent window via `postMessage`. |
| [`webExtension()`](/core/api/connectors/webExtension) | Browser extension | Generic connector that auto-detects any AE browser-extension wallet via the standard wallet-detector protocol. |
| [`ledger()`](/core/api/connectors/ledger) | Hardware | Connects to Ledger hardware wallets via the Aeternity Ledger app. Requires `@ledgerhq/hw-transport`. |
| [`metamaskSnap()`](/core/api/connectors/metamaskSnap) | MetaMask Snap | Uses the MetaMask Snaps API with `@aeternity-snap/plugin` for AE account management. |

### Built-in connectors from `@growae/reactive`

| Connector | Type | Description |
| --------- | ---- | ----------- |
| [`memory()`](/core/api/connectors/memory) | Development | In-memory accounts from secret keys. For development and server-side signing. |
| [`mock()`](/core/api/connectors/mock) | Testing | Configurable mock connector for unit tests. |

### Utility from `@growae/reactive-connectors`

| Utility | Description |
| ------- | ----------- |
| [`walletDetect()`](/core/api/connectors/walletDetect) | Scans the page for available Aeternity wallets (extensions, iframe wallets). Returns detected wallets and a `stop` function. |

## Use connectors in config

Pass connector **instances** (call the factory functions) to the `connectors` array in [`createConfig`](/core/api/createConfig):

```typescript
import { createConfig } from '@growae/reactive'
import { testnet, mainnet } from '@growae/reactive/networks'
import { superhero, iframe } from '@growae/reactive/connectors'

const config = createConfig({
  networks: [testnet, mainnet],
  connectors: [superhero(), iframe()],
})
```

Mix package and built-in connectors as needed:

```typescript
import { createConfig, memory, mock } from '@growae/reactive'
import { testnet } from '@growae/reactive/networks'
import { superhero, webExtension } from '@growae/reactive/connectors'

const config = createConfig({
  networks: [testnet],
  connectors: [
    superhero(),
    webExtension(),
    memory({ accounts: [{ secretKey: 'sk_...' }] }),
    mock({ accounts: ['ak_...'] }),
  ],
})
```

See [Configuration](/core/configuration) for the full config surface. For a fully custom integration, see [createConnector](/core/api/createConnector).

## Wallet detection

[`walletDetect()`](/core/api/connectors/walletDetect) wraps the Aeternity SDK’s wallet scanner. It listens for wallets (extensions, iframe hosts, and other detector-compatible sources) and accumulates them in a `Map`. Call the returned **`stop`** function when you no longer need the scan (or rely on **`timeout`** to stop automatically).

```typescript
import { walletDetect } from '@growae/reactive/connectors'

const { wallets, stop } = await walletDetect({
  onDetected: (wallet) => {
    console.log(wallet.name, wallet.id, wallet.type)
  },
  timeout: 5000,
})

// `wallets` is a Map<string, DetectedWallet>
for (const w of wallets.values()) {
  console.log(w.name)
}

// If you did not use `timeout`, stop manually when leaving the UI:
stop()
```

Optional parameters:

- **`debug`** — enable debug logging on the underlying browser connection.
- **`timeout`** — auto-stop after the given number of milliseconds.
- **`onDetected`** — callback invoked for each newly detected wallet.

Use detection to build a “Choose wallet” UI, then connect through a matching connector registered in config (for example [`webExtension()`](/core/api/connectors/webExtension) or [`superhero()`](/core/api/connectors/superhero)) rather than bypassing Reactive’s connector flow.

## Connector reference

| Symbol | Reference |
| ------ | --------- |
| `superhero()` | [/core/api/connectors/superhero](/core/api/connectors/superhero) |
| `iframe()` | [/core/api/connectors/iframe](/core/api/connectors/iframe) |
| `webExtension()` | [/core/api/connectors/webExtension](/core/api/connectors/webExtension) |
| `ledger()` | [/core/api/connectors/ledger](/core/api/connectors/ledger) |
| `metamaskSnap()` | [/core/api/connectors/metamaskSnap](/core/api/connectors/metamaskSnap) |
| `walletDetect()` | [/core/api/connectors/walletDetect](/core/api/connectors/walletDetect) |
| `memory()` | [/core/api/connectors/memory](/core/api/connectors/memory) |
| `mock()` | [/core/api/connectors/mock](/core/api/connectors/mock) |
