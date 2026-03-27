# Getting Started

## Overview

`@reactive/react` provides React hooks for interacting with the Aeternity blockchain. Built on top of `@reactive/core` and [TanStack Query](https://tanstack.com/query), it offers automatic caching, refetching, and loading states.

## Quick Start

### 1. Install

```bash
pnpm add @reactive/react @tanstack/react-query
```

### 2. Set Up Providers

```tsx
import { createConfig } from '@reactive/core'
import { testnet } from '@reactive/core/networks'
import { superhero } from '@reactive/core/connectors'
import { ReactiveProvider } from '@reactive/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const config = createConfig({
  networks: [testnet],
  connectors: [superhero()],
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
import { useConnect, useBalance } from '@reactive/react'

function Wallet() {
  const { connect, connectors } = useConnect()
  const { data: balance } = useBalance({ address: 'ak_2dA...' })

  return (
    <div>
      <button onClick={() => connect({ connector: connectors[0] })}>
        Connect
      </button>
      {balance && <p>Balance: {balance.ae} AE</p>}
    </div>
  )
}
```

## Default TTL

All transaction hooks (`useSpend`, `useSendTransaction`, `useCallContract`, `useDeployContract`, and AENS hooks) default to a **TTL of 300 blocks** (~15 hours). Override per-call:

```tsx
const { mutate: send } = useSpend()

send({
  recipient: 'ak_...',
  amount: '1.0',
  ttl: 0, // no expiration
})
```

## Next Steps

- [Installation](/react/installation) — detailed install guide
- [ReactiveProvider](/react/api/ReactiveProvider) — provider setup
- [useConnect](/react/api/hooks/useConnect) — wallet connection
- [useBalance](/react/api/hooks/useBalance) — balance queries
