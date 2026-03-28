<h1 align="center">@growae/reactive</h1>

<p align="center">
  Core vanilla TypeScript toolkit for Aeternity blockchain interactions
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@growae/reactive"><img src="https://img.shields.io/npm/v/@growae/reactive?colorA=21262d&colorB=3b82f6&style=flat" alt="Version"></a>
  <a href="https://www.npmjs.com/package/@growae/reactive"><img src="https://img.shields.io/npm/dm/@growae/reactive?colorA=21262d&colorB=3b82f6&style=flat" alt="Downloads"></a>
  <a href="https://github.com/growae/reactive/blob/main/LICENSE"><img src="https://img.shields.io/npm/l/@growae/reactive?colorA=21262d&colorB=3b82f6&style=flat" alt="MIT License"></a>
</p>

<br>

## Overview

Config-driven setup for Aeternity dApps. Provides actions (`spend`, `getBalance`, `signMessage`, `deployContract`, and more), network management, and a connector system. Use standalone or pair with a framework adapter.

## Install

```bash
# npm
npm install @growae/reactive

# yarn
yarn add @growae/reactive

# pnpm
pnpm add @growae/reactive
```

## Usage

```ts
import { createConfig } from '@growae/reactive'
import { getBalance, spend } from '@growae/reactive/actions'
import { testnet } from '@growae/reactive/networks'

const config = createConfig({ networks: [testnet] })

const balance = await getBalance(config, { address: 'ak_...' })

await spend(config, {
  recipient: 'ak_...',
  amount: '1.0',
})
```

## Dependencies

- [`@aeternity/aepp-sdk`](https://www.npmjs.com/package/@aeternity/aepp-sdk)
- [`zustand`](https://www.npmjs.com/package/zustand)
- Optional peer: [`@tanstack/query-core`](https://www.npmjs.com/package/@tanstack/query-core)

## Documentation

Visit [reactive.growae.io/core/getting-started](https://reactive.growae.io/core/getting-started) for the full documentation.

## License

[MIT](https://github.com/growae/reactive/blob/main/LICENSE)
