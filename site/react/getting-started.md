# Getting Started

## Overview

`@growae/reactive-react` provides React hooks for interacting with the Aeternity blockchain. Built on top of `@growae/reactive` and [TanStack Query](https://tanstack.com/query), it offers automatic caching, refetching, and loading states.

## Quick Start

### 1. Install

```bash
pnpm add @growae/reactive-react @tanstack/react-query
```

### 2. Set Up Providers

```tsx
import { createConfig } from '@growae/reactive'
import { testnet } from '@growae/reactive/networks'
import { superhero } from '@growae/reactive/connectors'
import { ReactiveProvider } from '@growae/reactive-react'
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
import { useConnect, useBalance } from '@growae/reactive-react'

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
