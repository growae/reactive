<h1 align="center">@growae/reactive-solid</h1>

<p align="center">
  Solid.js primitives for building Aeternity dApps
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@growae/reactive-solid"><img src="https://img.shields.io/npm/v/@growae/reactive-solid?colorA=21262d&colorB=3b82f6&style=flat" alt="Version"></a>
  <a href="https://www.npmjs.com/package/@growae/reactive-solid"><img src="https://img.shields.io/npm/dm/@growae/reactive-solid?colorA=21262d&colorB=3b82f6&style=flat" alt="Downloads"></a>
  <a href="https://github.com/growae/reactive/blob/main/LICENSE"><img src="https://img.shields.io/npm/l/@growae/reactive-solid?colorA=21262d&colorB=3b82f6&style=flat" alt="MIT License"></a>
</p>

<br>

## Overview

Solid.js adapter for `@growae/reactive`. Built on TanStack Solid Query, it provides `ReactiveProvider` and primitives like `useConnect`, `useBalance`, `useSpend`, `useReadContract`, and more.

## Install

```bash
# npm
npm install @growae/reactive-solid @growae/reactive @tanstack/solid-query

# yarn
yarn add @growae/reactive-solid @growae/reactive @tanstack/solid-query

# pnpm
pnpm add @growae/reactive-solid @growae/reactive @tanstack/solid-query
```

## Usage

```tsx
import { createConfig } from '@growae/reactive'
import { testnet } from '@growae/reactive/networks'
import { superhero } from '@growae/reactive-connectors'
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
        <Wallet />
      </ReactiveProvider>
    </QueryClientProvider>
  )
}
```

```tsx
import { useConnect, useBalance, useSpend } from '@growae/reactive-solid'

function Wallet() {
  const connect = useConnect()
  const balance = useBalance({ address: 'ak_...' })
  const spend = useSpend()

  return (
    <div>
      <button onClick={() => connect.connect({ connector: connect.connectors[0] })}>
        Connect
      </button>
      <Show when={balance.data}>
        <p>Balance: {balance.data.ae} AE</p>
      </Show>
      <button onClick={() => spend.mutate({ recipient: 'ak_...', amount: '1.0' })}>
        Send 1 AE
      </button>
    </div>
  )
}
```

## Peer Dependencies

- `solid-js >=1`
- `@tanstack/solid-query >=5`

## Documentation

Visit [reactive.growae.io/solid/getting-started](https://reactive.growae.io/solid/getting-started) for the full documentation.

## License

[MIT](https://github.com/growae/reactive/blob/main/LICENSE)
