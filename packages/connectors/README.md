<h1 align="center">@growae/reactive-connectors</h1>

<p align="center">
  Wallet connectors for Aeternity
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@growae/reactive-connectors"><img src="https://img.shields.io/npm/v/@growae/reactive-connectors?colorA=21262d&colorB=3b82f6&style=flat" alt="Version"></a>
  <a href="https://www.npmjs.com/package/@growae/reactive-connectors"><img src="https://img.shields.io/npm/dm/@growae/reactive-connectors?colorA=21262d&colorB=3b82f6&style=flat" alt="Downloads"></a>
  <a href="https://github.com/growae/reactive/blob/main/LICENSE"><img src="https://img.shields.io/npm/l/@growae/reactive-connectors?colorA=21262d&colorB=3b82f6&style=flat" alt="MIT License"></a>
</p>

<br>

## Overview

Wallet connectors for `@growae/reactive`. Includes `superhero()` (Superhero Wallet), `iframe()`, `webExtension()`, `ledger()`, `metamaskSnap()`, and `walletDetect()`, plus re-exports `mock()` and `memory()` from core.

## Install

```bash
# npm
npm install @growae/reactive-connectors @growae/reactive

# yarn
yarn add @growae/reactive-connectors @growae/reactive

# pnpm
pnpm add @growae/reactive-connectors @growae/reactive
```

## Usage

```ts
import { createConfig } from '@growae/reactive'
import { testnet } from '@growae/reactive/networks'
import {
  superhero,
  ledger,
  walletDetect,
} from '@growae/reactive-connectors'

const config = createConfig({
  networks: [testnet],
  connectors: [
    superhero(),
    ledger(),
    walletDetect(),
  ],
})
```

## Peer Dependencies

- `@aeternity/aepp-sdk >=14`
- Optional: `@ledgerhq/hw-transport >=6`

## Documentation

Visit [reactive.growae.io/core/getting-started](https://reactive.growae.io/core/getting-started) for the full documentation.

## License

[MIT](https://github.com/growae/reactive/blob/main/LICENSE)
