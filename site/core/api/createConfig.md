# createConfig

Creates a Reactive `Config` object that manages network connections, wallet state, and provides the foundation for all actions.

## Import

```typescript
import { createConfig } from '@reactive/core'
```

## Usage

```typescript
import { createConfig } from '@reactive/core'
import { mainnet, testnet } from '@reactive/core/networks'
import { superhero } from '@reactive/core/connectors'

const config = createConfig({
  networks: [mainnet, testnet],
  connectors: [superhero()],
})
```

## Parameters

### networks

- **Type:** `Network[]`
- **Required**

Array of networks the app supports. The first network is the default.

### connectors

- **Type:** `Connector[]`
- **Required**

Array of wallet connectors.

### storage

- **Type:** `Storage`
- **Default:** `createStorage({ storage: localStorage })`

Storage adapter for persisting connection state.

### ssr

- **Type:** `boolean`
- **Default:** `false`

Enable SSR-safe mode. Defers auto-reconnect to the client.

### syncConnectedNetwork

- **Type:** `boolean`
- **Default:** `true`

Automatically switch to the wallet's active network on connect.

## Return Type

```typescript
type Config = {
  readonly networks: readonly Network[]
  readonly connectors: readonly Connector[]
  readonly storage: Storage
  readonly state: State
  getNode(): Node
  subscribe(listener: (state: State) => void): () => void
  setState(updater: (prev: State) => State): void
  destroy(): void
}
```

## Type Narrowing

Use the `Register` type to get type-safe network IDs across your app:

```typescript
// reactive.d.ts
import type { Config } from '@reactive/core'
import { mainnet, testnet } from '@reactive/core/networks'

declare module '@reactive/core' {
  interface Register {
    config: typeof config
  }
}
```
