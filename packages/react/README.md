<h1 align="center">@growae/reactive-react</h1>

<p align="center">
  React hooks for building Aeternity dApps
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@growae/reactive-react"><img src="https://img.shields.io/npm/v/@growae/reactive-react?colorA=21262d&colorB=3b82f6&style=flat" alt="Version"></a>
  <a href="https://www.npmjs.com/package/@growae/reactive-react"><img src="https://img.shields.io/npm/dm/@growae/reactive-react?colorA=21262d&colorB=3b82f6&style=flat" alt="Downloads"></a>
  <a href="https://github.com/growae/reactive/blob/main/LICENSE"><img src="https://img.shields.io/npm/l/@growae/reactive-react?colorA=21262d&colorB=3b82f6&style=flat" alt="MIT License"></a>
</p>

<br>

## Overview

React adapter for `@growae/reactive`. Built on TanStack React Query, it provides `ReactiveProvider` and hooks like `useConnect`, `useBalance`, `useSpend`, `useReadContract`, and more.

## Install

```bash
# npm
npm install @growae/reactive-react @growae/reactive @tanstack/react-query

# yarn
yarn add @growae/reactive-react @growae/reactive @tanstack/react-query

# pnpm
pnpm add @growae/reactive-react @growae/reactive @tanstack/react-query
```

## Usage

```tsx
import { createConfig } from '@growae/reactive'
import { testnet } from '@growae/reactive/networks'
import { superhero } from '@growae/reactive-connectors'
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
        <Wallet />
      </ReactiveProvider>
    </QueryClientProvider>
  )
}
```

```tsx
import { useConnect, useBalance, useSpend } from '@growae/reactive-react'

function Wallet() {
  const { connect, connectors } = useConnect()
  const { data: balance } = useBalance({ address: 'ak_...' })
  const { mutate: send } = useSpend()

  return (
    <div>
      <button onClick={() => connect({ connector: connectors[0] })}>
        Connect
      </button>
      {balance && <p>Balance: {balance.ae} AE</p>}
      <button onClick={() => send({ recipient: 'ak_...', amount: '1.0' })}>
        Send 1 AE
      </button>
    </div>
  )
}
```

## Peer Dependencies

- `react >=18`
- `@tanstack/react-query >=5`

## Documentation

Visit [reactive.growae.io/react/getting-started](https://reactive.growae.io/react/getting-started) for the full documentation.

## License

[MIT](https://github.com/growae/reactive/blob/main/LICENSE)
