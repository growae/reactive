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
import { superhero } from '@growae/reactive/connectors'
import { ReactiveProvider } from '@growae/reactive-solid'
import { QueryClient, QueryClientProvider } from '@tanstack/solid-query'

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

### 3. Use Primitives

```tsx
import { useConnect, useBalance } from '@growae/reactive-solid'

function Wallet() {
  const { connect, connectors } = useConnect()
  const balance = useBalance({ address: 'ak_2dA...' })

  return (
    <div>
      <For each={connectors()}>
        {(connector) => (
          <button onClick={() => connect({ connector })}>
            {connector.name}
          </button>
        )}
      </For>
      <Show when={balance.data}>
        <p>Balance: {balance.data.ae} AE</p>
      </Show>
    </div>
  )
}
```

## Default TTL

All transaction primitives (`useSpend`, `useSendTransaction`, `useCallContract`, `useDeployContract`) default to a **TTL of 300 blocks** (~15 hours). Override per-call:

```typescript
const spend = useSpend()

spend.mutate({
  recipient: 'ak_...',
  amount: '1.0',
  ttl: 0, // no expiration
})
```

## Next Steps

- [Installation](/solid/installation) — detailed install guide
- [ReactiveProvider](/solid/api/ReactiveProvider) — provider setup
- [useConnect](/solid/api/primitives/useConnect) — wallet connection
- [useBalance](/solid/api/primitives/useBalance) — balance queries
