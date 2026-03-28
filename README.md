<h1 align="center">reactive</h1>

<p align="center">
  Type-safe toolkit for building Aeternity dApps
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@growae/reactive"><img src="https://img.shields.io/npm/v/@growae/reactive?colorA=21262d&colorB=3b82f6&style=flat" alt="Version"></a>
  <a href="https://www.npmjs.com/package/@growae/reactive"><img src="https://img.shields.io/npm/dm/@growae/reactive?colorA=21262d&colorB=3b82f6&style=flat" alt="Downloads"></a>
  <a href="https://github.com/growae/reactive/blob/main/LICENSE"><img src="https://img.shields.io/npm/l/@growae/reactive?colorA=21262d&colorB=3b82f6&style=flat" alt="MIT License"></a>
  <a href="https://github.com/growae/reactive/actions/workflows/ci.yml"><img src="https://growae.github.io/reactive/coverage/badge.svg" alt="Coverage"></a>
</p>

<br>

## Features

- **Framework support** — First-class React hooks, Vue composables, and Solid primitives
- **Type safe** — Fully typed APIs, inferred parameters, and typed Sophia contract interactions
- **Aeternity native** — AENS names, oracles, state channels, generalized accounts, and Sophia contracts
- **Wallet connectors** — Superhero Wallet, WebExtension, Iframe, Ledger, and MetaMask Snap
- **Caching & reactivity** — Built on [TanStack Query](https://tanstack.com/query) for automatic caching, refetching, and loading states
- **Modular** — Use `@growae/reactive` standalone or with any framework adapter
- **CLI tooling** — Generate typed contract bindings from Sophia ACI and scaffold new projects

## Packages

| Package | Description |
|---|---|
| [`@growae/reactive`](https://www.npmjs.com/package/@growae/reactive) | Core — vanilla TypeScript actions and config |
| [`@growae/reactive-react`](https://www.npmjs.com/package/@growae/reactive-react) | React hooks with TanStack Query |
| [`@growae/reactive-vue`](https://www.npmjs.com/package/@growae/reactive-vue) | Vue composables with TanStack Query + Nuxt module |
| [`@growae/reactive-solid`](https://www.npmjs.com/package/@growae/reactive-solid) | Solid.js primitives with TanStack Query |
| [`@growae/reactive-connectors`](https://www.npmjs.com/package/@growae/reactive-connectors) | Wallet connectors |
| [`@growae/reactive-cli`](https://www.npmjs.com/package/@growae/reactive-cli) | CLI for typed contract bindings |
| [`@growae/create-reactive`](https://www.npmjs.com/package/@growae/create-reactive) | Project scaffolder |

## Quick Start

### Install

```bash
pnpm add @growae/reactive-react @tanstack/react-query
```

### Set up providers

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
        <YourApp />
      </ReactiveProvider>
    </QueryClientProvider>
  )
}
```

### Use hooks

```tsx
import { useConnect, useBalance, useSpend } from '@growae/reactive-react'

function Wallet() {
  const { connect, connectors } = useConnect()
  const { data: balance } = useBalance({ address: 'ak_2dA...' })
  const { mutate: send } = useSpend()

  return (
    <div>
      <button onClick={() => connect({ connector: connectors[0] })}>
        Connect Wallet
      </button>
      {balance && <p>Balance: {balance.ae} AE</p>}
      <button onClick={() => send({ recipient: 'ak_...', amount: '1.0' })}>
        Send 1 AE
      </button>
    </div>
  )
}
```

### Vanilla TypeScript

Don't need a framework? Use the core directly:

```typescript
import { createConfig } from '@growae/reactive'
import { getBalance, spend } from '@growae/reactive/actions'
import { mainnet } from '@growae/reactive/networks'

const config = createConfig({ networks: [mainnet] })

const balance = await getBalance(config, { address: 'ak_2dA...' })

await spend(config, {
  recipient: 'ak_2dA...',
  amount: '1.5',
})
```

## Aeternity-Specific Features

Reactive provides typed APIs for Aeternity protocol features that have no equivalent in EVM chains:

### AENS (Aeternity Name System)

```typescript
import { preclaimName, claimName, updateName } from '@growae/reactive/actions'

await preclaimName(config, { name: 'alice.chain' })
await claimName(config, { name: 'alice.chain' })
await updateName(config, {
  name: 'alice.chain',
  pointers: { accountPubkey: 'ak_...' },
})
```

### Oracles

```typescript
import { registerOracle, respondToQuery } from '@growae/reactive/actions'

const oracle = await registerOracle(config, {
  queryFormat: 'string',
  responseFormat: 'string',
})

await respondToQuery(config, {
  oracleId: oracle.id,
  queryId: '...',
  response: 'answer',
})
```

### State Channels

```typescript
import { openChannel } from '@growae/reactive/actions'

const channel = await openChannel(config, {
  initiatorAmount: '1.0',
  responderAmount: '1.0',
  responderNode: 'ak_...',
})
```

### Sophia Contracts

```typescript
import { deployContract, callContract } from '@growae/reactive/actions'

const { address } = await deployContract(config, {
  code: contractBytecode,
  aci: contractAci,
  args: ['initial_value'],
})

const result = await callContract(config, {
  address,
  aci: contractAci,
  function: 'get_value',
  args: [],
})
```

## Scaffold a New Project

```bash
pnpm create @growae/reactive
```

Choose from 6 templates: `vite-react`, `vite-vue`, `vite-solid`, `vite-vanilla`, `next`, or `nuxt`.

## Generate Typed Contract Bindings

```bash
npx @growae/reactive-cli generate --aci ./contracts/Token.json
```

## Documentation

Visit [reactive.growae.io](https://reactive.growae.io) for the full documentation, including:

- [Core API Reference](https://reactive.growae.io/core/getting-started)
- [React Hooks](https://reactive.growae.io/react/getting-started)
- [Vue Composables](https://reactive.growae.io/vue/getting-started)
- [Solid Primitives](https://reactive.growae.io/solid/getting-started)
- [AENS Guide](https://reactive.growae.io/core/guides/aens)
- [Oracles Guide](https://reactive.growae.io/core/guides/oracles)
- [State Channels Guide](https://reactive.growae.io/core/guides/channels)
- [Smart Contracts Guide](https://reactive.growae.io/core/guides/contracts)

## Contributing

Contributions are welcome! Please read our [Contributing Guide](.github/CONTRIBUTING.md) before submitting a PR.

## Acknowledgements

Reactive's API design and architecture are inspired by [wagmi](https://wagmi.sh) — the excellent TypeScript toolkit for Ethereum. We adapted the same developer experience patterns (config-driven setup, framework adapters, connector system, TanStack Query integration) for the Aeternity blockchain's unique capabilities.

## License

[MIT](LICENSE)
