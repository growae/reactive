# Reactive

Reactive is an MIT-licensed æternity toolkit from GrowAE. JavaScript, Python and Dart share Rust code for protocol operations. The JavaScript packages combine a fetch-based node client with Wagmi-inspired actions and React, Vue and Solid adapters.

## JavaScript 0.2

Install `@growae/reactive` for vanilla JavaScript. Add `@growae/reactive-react`, `@growae/reactive-vue` or `@growae/reactive-solid` and the corresponding TanStack Query peer for a framework app.

```ts
import { createConfig, getHeight, testnet } from '@growae/reactive'
import { loadProtocol } from '@growae/reactive/protocol'

const config = createConfig({ networks: [testnet] })
const height = await getHeight(config)
const { tx } = await loadProtocol()
```

The core supports node reads, AENS pointer resolution, offline transaction building, local signing, spends and transaction inclusion. The memory and mock connectors ship with core. MetaMask Snap and the connector contract support wallet integrations. JavaScript loads the packaged WASM asset on demand.

**New hook APIs.** The working tree restores SDK-free Sophia reads and writes, AE typed data, indexed events, contract hook factories, fee queries and AEX-9 operations. See the [Wagmi crosswalk](site/react/wagmi-hooks.md) and [Sophia guide](site/core/sophia-contracts.md).

**Migrating from 0.1 to the 0.2 baseline.** The SDK-free line has a smaller API. Sophia/ACI actions, oracles, generalized-account helpers, state-channel flows and several wallet integrations remain available on the [0.1.0 tag](https://github.com/growae/reactive/tree/v0.1.0). Read the [migration guide](site/core/rust-protocol.md) before upgrading. The [roadmap](ROADMAP.md) maps every root Wagmi hook and the Tempo extension to AE behavior and prerequisites.

## Native bindings

[Python](bindings/python/README.md) ships a native PyO3 wheel built with maturin. [Dart](bindings/dart/README.md) loads a desktop library built with flutter_rust_bridge. Both wrap the same transaction, fee and signing primitives; each has source build instructions and corpus tests. [Rust crates and parity evidence](crates/README.md)

## Development

From the repository root, use Node ≥22.12 and the pinned pnpm. Run `pnpm install --frozen-lockfile`, `pnpm build`, `pnpm check:types`, `pnpm exec vitest run`, and `pnpm docs:build`. The package import gate is `pnpm --filter @growae/reactive test:node-resolution`. From `crates/`, run `cargo test --workspace --locked`. The [devnet configuration](docker-compose.yml) supports `pnpm test:integration`.

The old JS SDK is a development reference for independent byte and signing comparisons. Shipped dependencies are checked in a separate packed consumer.
