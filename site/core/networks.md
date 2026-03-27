# Networks

Reactive uses **networks** instead of chains. Aeternity identifies networks by string IDs (e.g. `ae_mainnet`, `ae_uat`) rather than numeric chain IDs.

## Pre-defined Networks

Reactive ships with two pre-defined networks:

```typescript
import { mainnet, testnet } from '@growae/reactive/networks'
```

### Mainnet

| Property | Value |
|----------|-------|
| `id` | `ae_mainnet` |
| `name` | `Aeternity Mainnet` |
| `nodeUrl` | `https://mainnet.aeternity.io` |
| `compilerUrl` | `https://compiler.aepps.com` |

### Testnet

| Property | Value |
|----------|-------|
| `id` | `ae_uat` |
| `name` | `Aeternity Testnet` |
| `nodeUrl` | `https://testnet.aeternity.io` |
| `compilerUrl` | `https://compiler.aepps.com` |

## Custom Networks

Define a custom network for local development or private chains:

```typescript
import { defineNetwork } from '@growae/reactive'

const localnet = defineNetwork({
  id: 'ae_dev',
  name: 'Local Development',
  nodeUrl: 'http://localhost:3013',
  compilerUrl: 'http://localhost:3080',
})
```

## Network Type

```typescript
type Network = {
  id: string
  name: string
  nodeUrl: string
  compilerUrl?: string
  middlewareUrl?: string
}
```

## Using Multiple Networks

```typescript
import { createConfig } from '@growae/reactive'
import { mainnet, testnet } from '@growae/reactive/networks'

const config = createConfig({
  networks: [mainnet, testnet],
  connectors: [superhero()],
})
```

The first network in the array is the default. Users can switch networks via their wallet or programmatically using `switchNetwork`.
