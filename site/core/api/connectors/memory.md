# memory

In-memory signing accounts backed by secret keys from `@aeternity/aepp-sdk` `MemoryAccount`.

## Import

```typescript
import { memory } from '@growae/reactive'
```

Built into core — **not** exported from `@growae/reactive/connectors`.

## Usage

```typescript
import { createConfig } from '@growae/reactive'
import { testnet } from '@growae/reactive/networks'
import { memory } from '@growae/reactive'

const config = createConfig({
  networks: [testnet],
  connectors: [
    memory({
      accounts: [{ secretKey: 'sk_...' }],
      name: 'Dev wallet',
    }),
  ],
})
```

::: danger Production

Never use real mainnet keys or funded accounts with `memory()` in production. Keys live in memory in your process and are not suitable for end-user wallets.

:::

## Parameters

### accounts

- **Type:** `Array<{ secretKey: string }>`
- **Required**

Each entry becomes a `MemoryAccount` used for addresses and signing.

### name

- **Type:** `string`
- **Default:** `'Memory Account'`

Connector display name.

## Connector Details (type, id, capabilities)

| Field | Value |
| ----- | ----- |
| **type** | `'memory'` |
| **id** | `'memory'` |
| **name** | From `name` (default `'Memory Account'`) |

**Use case:** Local development, automation, or trusted server-side signing.

**Capabilities:** `switchNetwork`, `signTransaction`, `signMessage` (first account).
