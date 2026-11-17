# Getting Started

## Overview

`@growae/reactive-react` provides React hooks for interacting with the Aeternity blockchain. Built on top of `@growae/reactive` and [TanStack Query](https://tanstack.com/query), it offers automatic caching, refetching, and loading states.

## Quick Start

### 1. Install

::: code-group

```bash [npm]
npm install @growae/reactive-react @tanstack/react-query
```

```bash [yarn]
yarn add @growae/reactive-react @tanstack/react-query
```

```bash [pnpm]
pnpm add @growae/reactive-react @tanstack/react-query
```

:::

### 2. Set Up Providers

```tsx
import { createConfig } from '@growae/reactive'
import { testnet } from '@growae/reactive/networks'
import { metamaskSnap } from '@growae/reactive/connectors'
import { ReactiveProvider } from '@growae/reactive-react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

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

### 3. Use Hooks

```tsx
import { useConnect, useBalance } from '@growae/reactive-react'

function Wallet() {
  const { connect, connectors } = useConnect()
  const { data: balance } = useBalance()
  const connector = connectors[0]

  return (
    <div>
      <button disabled={!connector} onClick={() => connector && connect({ connector })}>
        Connect
      </button>
      {balance && <p>Balance: {balance} aettos</p>}
    </div>
  )
}
```

## Transaction encoding

See the [Rust protocol guide](/core/rust-protocol) for signing, wire field types and the list of supported operations.

## Next Steps

- [Installation](/react/installation) — detailed install guide
- [ReactiveProvider](/react/api/ReactiveProvider) — provider setup
- [Connectors](/core/guides/connectors) — configure a wallet or provide a custom connector
- [Wagmi hook equivalents](/react/wagmi-hooks) — find the æternity hook for a Wagmi operation
- [Contract hook factories](/react/contract-hook-factories) — define hooks for your own contract interface
- [useConnect](/react/api/hooks/useConnect) — wallet connection
- [useBalance](/react/api/hooks/useBalance) — balance queries
