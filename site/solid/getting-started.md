# Getting Started

## Overview

`@growae/reactive-solid` provides Solid primitives for interacting with the Aeternity blockchain. Built on top of `@growae/reactive` and [TanStack Solid Query](https://tanstack.com/query/v5/docs/framework/solid), it offers reactive signals, automatic caching, and loading states.

## Quick Start

### 1. Install

::: code-group

```bash [npm]
npm install @growae/reactive-solid @tanstack/solid-query
```

```bash [yarn]
yarn add @growae/reactive-solid @tanstack/solid-query
```

```bash [pnpm]
pnpm add @growae/reactive-solid @tanstack/solid-query
```

:::

### 2. Set Up Provider

```tsx
import { createConfig } from '@growae/reactive'
import { testnet } from '@growae/reactive/networks'
import { metamaskSnap } from '@growae/reactive/connectors'
import { ReactiveProvider } from '@growae/reactive-solid'
import { QueryClient, QueryClientProvider } from '@tanstack/solid-query'

const config = createConfig({
  networks: [testnet],
  connectors: [metamaskSnap()],
})

const queryClient = new QueryClient()

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ReactiveProvider config={config}>
        <MyApp />
      </ReactiveProvider>
    </QueryClientProvider>
  )
}
```

### 3. Use Primitives

```tsx
import { useBalance, useConnect, useConnectors } from '@growae/reactive-solid'
import { For } from 'solid-js'

function Wallet() {
  const connection = useConnect()
  const connectors = useConnectors()
  const balance = useBalance()
  return (
    <section>
      <For each={connectors()}>{connector =>
        <button onClick={() => connection.mutate({ connector })}>{connector.name}</button>
      }</For>
      <p>{balance.data ?? '—'} aettos</p>
    </section>
  )
}
```

## Transaction encoding

See the [Rust protocol guide](/core/rust-protocol) for signing, wire field types and the list of supported operations.

## Next Steps

- [Installation](/solid/installation) — detailed install guide
- [ReactiveProvider](/solid/api/ReactiveProvider) — provider setup
- [Connectors](/core/guides/connectors) — all available wallet connectors (MetaMask Snap, Ledger, MetaMask Snap, and more)
- [useConnect](/solid/api/primitives/useConnect) — wallet connection
- [useBalance](/solid/api/primitives/useBalance) — balance queries
