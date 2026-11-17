# Getting Started

## Overview

`@growae/reactive` is the framework-agnostic foundation for interacting with the Aeternity blockchain. It provides type-safe actions for sending transactions, reading balances, building and signing transactions through Rust, and querying AENS names.

## Quick Start

### 1. Install

::: code-group

```bash [npm]
npm install @growae/reactive
```

```bash [yarn]
yarn add @growae/reactive
```

```bash [pnpm]
pnpm add @growae/reactive
```

:::

### 2. Create a Config

```typescript
import { createConfig } from '@growae/reactive'
import { testnet } from '@growae/reactive/networks'
import { metamaskSnap } from '@growae/reactive/connectors'

const config = createConfig({
  networks: [testnet],
  connectors: [metamaskSnap()],
})
```

### 3. Use Actions

```typescript
import { getBalance, spend } from '@growae/reactive/actions'

// Read balance
const balance = await getBalance(config, {
  address: 'ak_2dA...',
})
console.log(balance) // { aettos: 1000000000000000000n, ae: '1.0' }

// Send AE (TTL defaults to 300 blocks)
const result = await spend(config, {
  recipient: 'ak_2dA...',
  amount: 1500000000000000000n, // in AE
})
```

## Default TTL

All transactions in Reactive default to a **TTL of 300 blocks** (~15 hours) above the current height. This prevents stale transactions from lingering in the mempool indefinitely.

You can override this per-action:

```typescript
await spend(config, {
  recipient: 'ak_2dA...',
  amount: 1000000000000000000n,
  ttl: 0, // no expiration
})
```

Or set a custom TTL:

```typescript
await spend(config, {
  recipient: 'ak_2dA...',
  amount: 1000000000000000000n,
  ttl: 100, // 100 blocks (~5 hours)
})
```

## Next Steps

- [Installation](/core/installation) — detailed install guide
- [Configuration](/core/configuration) — learn about `createConfig` options
- [Connectors](/core/guides/connectors) — all available wallet connectors (MetaMask Snap, memory, mock, and custom connectors)
- [Networks](/core/networks) — configure mainnet, testnet, or custom networks



[Supported APIs and migration notes](./rust-protocol)
