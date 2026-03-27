# Getting Started

## Overview

`@reactive/core` is the framework-agnostic foundation for interacting with the Aeternity blockchain. It provides type-safe actions for sending transactions, reading balances, working with Sophia contracts, AENS names, oracles, and state channels.

## Quick Start

### 1. Install

```bash
pnpm add @reactive/core
```

### 2. Create a Config

```typescript
import { createConfig } from '@reactive/core'
import { testnet } from '@reactive/core/networks'
import { superhero } from '@reactive/core/connectors'

const config = createConfig({
  networks: [testnet],
  connectors: [superhero()],
})
```

### 3. Use Actions

```typescript
import { getBalance, spend } from '@reactive/core/actions'

// Read balance
const balance = await getBalance(config, {
  address: 'ak_2dA...',
})
console.log(balance) // { aettos: 1000000000000000000n, ae: '1.0' }

// Send AE (TTL defaults to 300 blocks)
const result = await spend(config, {
  recipient: 'ak_2dA...',
  amount: '1.5', // in AE
})
```

## Default TTL

All transactions in Reactive default to a **TTL of 300 blocks** (~15 hours) above the current height. This prevents stale transactions from lingering in the mempool indefinitely.

You can override this per-action:

```typescript
await spend(config, {
  recipient: 'ak_2dA...',
  amount: '1.0',
  ttl: 0, // no expiration
})
```

Or set a custom TTL:

```typescript
await spend(config, {
  recipient: 'ak_2dA...',
  amount: '1.0',
  ttl: 100, // 100 blocks (~5 hours)
})
```

## Next Steps

- [Installation](/core/installation) — detailed install guide
- [Configuration](/core/configuration) — learn about `createConfig` options
- [Networks](/core/networks) — configure mainnet, testnet, or custom networks
- [AENS Guide](/core/guides/aens) — register and manage `.chain` names
- [Contracts Guide](/core/guides/contracts) — deploy and call Sophia contracts
