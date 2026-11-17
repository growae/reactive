# Configuration

The `createConfig` function is the entry point for all Reactive applications. It sets up the networks, connectors, storage, and internal state management.

## Basic Usage

```typescript
import { createConfig } from '@growae/reactive'
import { testnet } from '@growae/reactive/networks'
import { metamaskSnap } from '@growae/reactive/connectors'

const config = createConfig({
  networks: [testnet],
  connectors: [metamaskSnap()],
})
```

## Networks

Define which Aeternity networks your app supports. Reactive ships with `mainnet` and `testnet` presets:

```typescript
import { mainnet, testnet } from '@growae/reactive/networks'

const config = createConfig({
  networks: [mainnet, testnet],
  connectors: [metamaskSnap()],
})
```

See [Networks](/core/networks) for custom network configuration.

## Connectors

Connectors handle wallet communication. Reactive provides connectors for the MetaMask Snap and other Aeternity wallets:

```typescript
import { metamaskSnap } from '@growae/reactive/connectors'

const config = createConfig({
  networks: [testnet],
  connectors: [
    metamaskSnap(),
  ],
})
```

See [createConnector](/core/api/createConnector) for building custom connectors.

## Storage

By default, Reactive persists connection state to `localStorage`. You can customize this:

```typescript
import { createConfig, createStorage } from '@growae/reactive'

const config = createConfig({
  networks: [testnet],
  connectors: [metamaskSnap()],
  storage: createStorage({ storage: sessionStorage }),
})
```

See [createStorage](/core/api/createStorage) for all storage options.

## SSR Mode

When using server-side rendering (Next.js, Nuxt, SolidStart), enable SSR mode to prevent hydration mismatches:

```typescript
const config = createConfig({
  networks: [testnet],
  connectors: [metamaskSnap()],
  ssr: true,
})
```

In SSR mode, Reactive skips auto-reconnect on the server and defers it to the client.

## Full Options Reference

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `networks` | `Network[]` | — | Required. Networks to support. |
| `connectors` | `Connector[]` | — | Required. Wallet connectors. |
| `storage` | `Storage` | `localStorage` | State persistence layer. |
| `ssr` | `boolean` | `false` | Enable SSR-safe mode. |
| `syncConnectedNetwork` | `boolean` | `true` | Auto-switch to wallet's active network. |
